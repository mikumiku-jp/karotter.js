export interface ParsedCookie {
  name: string;
  value: string;
}

export function parseSetCookie(header: string): ParsedCookie | null {
  const head = header.split(";", 1)[0];
  if (!head) return null;
  const eq = head.indexOf("=");
  if (eq <= 0) return null;
  return {
    name: head.slice(0, eq).trim(),
    value: head.slice(eq + 1).trim(),
  };
}

export function buildCookieHeader(cookies: string[]): string | undefined {
  return cookies.length > 0 ? cookies.join("; ") : undefined;
}
