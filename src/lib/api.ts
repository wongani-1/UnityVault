type ApiOptions = {
  method?: string;
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
  skipCache?: boolean;
  cacheTtlMs?: number;
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const DEFAULT_GET_CACHE_TTL_MS = 15_000;
const inFlightGetRequests = new Map<string, Promise<unknown>>();
const getResponseCache = new Map<string, { data: unknown; expiresAt: number }>();

const getToken = () => sessionStorage.getItem("unityvault:token") || "";

export const apiRequest = async <T>(path: string, options: ApiOptions = {}) => {
  const method = (options.method || "GET").toUpperCase();
  const token = options.token || getToken();
  const cacheKey = `${method}:${path}:${token}`;
  const shouldUseCache = method === "GET" && !options.body && !options.skipCache;

  if (shouldUseCache) {
    const cached = getResponseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }

    const inFlight = inFlightGetRequests.get(cacheKey);
    if (inFlight) {
      return (await inFlight) as T;
    }
  } else if (method !== "GET") {
    getResponseCache.clear();
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const executeRequest = async (): Promise<T> => {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        credentials: "include",
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: options.signal,
      });
    } catch {
      throw new Error("Network error. Please check your connection and try again.");
    }

    if (!response.ok) {
      let message = "Request failed";
      try {
        const data = (await response.json()) as { error?: string };
        message = data.error || message;
      } catch {
        // ignore
      }

      // On 401/403 clear session and redirect to login
      if (response.status === 401 || response.status === 403) {
        sessionStorage.removeItem("unityvault:token");
        sessionStorage.removeItem("unityvault:role");
        sessionStorage.removeItem("unityvault:adminGroup");
        sessionStorage.removeItem("unityvault:memberProfile");
        getResponseCache.clear();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }

      throw new Error(message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  };

  if (shouldUseCache) {
    const requestPromise = executeRequest()
      .then((data) => {
        getResponseCache.set(cacheKey, {
          data,
          expiresAt: Date.now() + (options.cacheTtlMs ?? DEFAULT_GET_CACHE_TTL_MS),
        });
        return data;
      })
      .finally(() => {
        inFlightGetRequests.delete(cacheKey);
      });

    inFlightGetRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  return executeRequest();
};

/** Download a file (blob) from the API with proper auth and 401/403 handling. */
export const apiDownload = async (path: string, options: { method?: string; body?: unknown } = {}): Promise<Blob> => {
  const method = (options.method || "GET").toUpperCase();
  const token = getToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      credentials: "include",
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error("Network error. Please check your connection and try again.");
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      sessionStorage.removeItem("unityvault:token");
      sessionStorage.removeItem("unityvault:role");
      sessionStorage.removeItem("unityvault:adminGroup");
      sessionStorage.removeItem("unityvault:memberProfile");
      getResponseCache.clear();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    throw new Error("Failed to download file");
  }

  return response.blob();
};
