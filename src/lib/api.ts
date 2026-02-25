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
