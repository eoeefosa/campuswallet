export const BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://campus-wallet-aoy1.onrender.com/api";

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
  console.log("BASE =", BASE);
  console.log("PATH =", path);
  console.log("URL =", `${BASE}${path}`);
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  console.log("====================================");
  console.log(res);
  console.log("====================================");
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
