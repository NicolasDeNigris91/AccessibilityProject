export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
};
