import { getClientId } from "./clientId";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  const clientId = getClientId();
  if (clientId) headers.set("X-Client-Id", clientId);
  return fetch(input, { ...init, headers });
}

export const fetcher = async <T>(url: string): Promise<T> => {
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
};
