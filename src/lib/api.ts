type ApiOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const getToken = () => sessionStorage.getItem("unityvault:token") || "";

export const apiRequest = async <T>(path: string, options: ApiOptions = {}) => {
  const token = options.token || getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: options.method || "GET",
      headers,
      credentials: "include",
      body: options.body ? JSON.stringify(options.body) : undefined,
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

  return (await response.json()) as T;
};
