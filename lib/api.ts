// Every call in the app uses paths WITHOUT the "/api" prefix (e.g. "/auth/login",
// "/wallet/balance"), so BASE must always end in exactly "/api". This normalizes
// the env value whether it's the bare origin, has a trailing slash, or already
// ends in "/api" — preventing both missing-/api (404) and double-/api (404).
const RAW_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://campus-wallet-aoy1.onrender.com";

export const BASE = RAW_BASE.replace(/\/+$/, "").replace(/\/api$/, "") + "/api";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: object) {
  localStorage.setItem("user", JSON.stringify(user));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
