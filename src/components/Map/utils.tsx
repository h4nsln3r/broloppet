export function addQueryParam(url: string, key: string, value: string) {
  // simple helper: append or replace param
  try {
    const u = new URL(url, "https://example.com");
    u.searchParams.set(key, value);
    // If original URL was relative to root (maps embed), try to return with same origin
    if (url.startsWith("http")) return u.toString();
    // For embed URLs like 'https://www.google.com/maps?q=...&output=embed' URL() works fine
    return u.toString();
  } catch (e) {
    // fallback: naive append
    const sep = url.includes("?") ? "&" : "?";
    console.log(e);
    return (
      url + sep + encodeURIComponent(key) + "=" + encodeURIComponent(value)
    );
  }
}
export const defaultEmbed = addQueryParam(WEDDING.maps.embedSrc, "t", "k");
const ceremonyEmbed = addQueryParam(
  addQueryParam(WEDDING.maps.ceremonyLink, "output", "embed"),
  "t",
  "k",
);
export const partyEmbed = addQueryParam(
  addQueryParam(WEDDING.maps.partyLink, "output", "embed"),
  "t",
  "k",
);
