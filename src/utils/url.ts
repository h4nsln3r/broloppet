/**
 * Lägger till eller ersätter en query-parameter i en URL.
 */
export function addQueryParam(url: string, key: string, value: string): string {
  try {
    const u = new URL(url, "https://example.com");
    u.searchParams.set(key, value);
    return u.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }
}
