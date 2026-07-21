import { API_BASE_URL } from "@/lib/api-client";

export async function serverFetch<T>(
  path: string,
  options: { revalidate?: number; params?: Record<string, string | number | boolean | undefined> } = {},
): Promise<T> {
  const search = new URLSearchParams();
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== "") search.set(key, String(value));
    }
  }
  const query = search.toString();
  const url = `${API_BASE_URL}${path}${query ? `?${query}` : ""}`;

  const response = await fetch(url, { next: { revalidate: options.revalidate ?? 60 } });

  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }

  const body = await response.json();
  return body.data as T;
}
