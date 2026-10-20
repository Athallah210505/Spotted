export function parseTikTokUrl(input: string): string | null {
  if (input.length > 2048) return null;
  try {
    const url = new URL(input.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      return null;
    const video =
      ["www.tiktok.com", "tiktok.com"].includes(url.hostname) &&
      /^\/@[\w.-]+\/video\/\d+\/?$/.test(url.pathname);
    const short =
      ["vm.tiktok.com", "vt.tiktok.com"].includes(url.hostname) &&
      /^\/[a-zA-Z0-9]+\/?$/.test(url.pathname);
    if (!video && !short) return null;
    url.search = "";
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}
