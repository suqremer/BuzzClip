import { API_URL } from "./constants";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  let res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // On 401, try refreshing the access token once
  if (res.status === 401 && path !== "/api/auth/refresh") {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: "include",
      });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "エラーが発生しました" }));
    throw new ApiError(res.status, body.detail || "エラーが発生しました");
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export async function apiGet<T>(path: string, options?: RequestInit): Promise<T> {
  return request<T>(path, { method: "GET", ...options });
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  let res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await fetch(`${API_URL}${path}`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "エラーが発生しました" }));
    throw new ApiError(res.status, body.detail || "エラーが発生しました");
  }

  return res.json();
}
