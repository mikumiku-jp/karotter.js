import { randomUUID } from "node:crypto";
import { parseSetCookie } from "../util/cookie.js";
import type { ClientType } from "../util/types.js";

export interface AuthStoreOptions {
  accessToken?: string | null;
  refreshToken?: string | null;
  csrfToken?: string | null;
  cookies?: string[];
  deviceId?: string;
  clientType?: ClientType;
  deviceName?: string;
}

const CSRF_COOKIE = "karotter_csrf";

export class AuthStore {
  accessToken: string | null;
  refreshToken: string | null;
  csrfToken: string | null;
  cookies: string[];
  readonly deviceId: string;
  readonly clientType: ClientType;
  readonly deviceName: string;

  constructor(options: AuthStoreOptions = {}) {
    this.accessToken = options.accessToken ?? null;
    this.refreshToken = options.refreshToken ?? null;
    this.csrfToken = options.csrfToken ?? null;
    this.cookies = options.cookies ?? [];
    this.deviceId = options.deviceId ?? randomUUID();
    this.clientType = options.clientType ?? "web";
    this.deviceName =
      options.deviceName ?? defaultDeviceName(this.clientType);
  }

  get isAuthenticated(): boolean {
    return Boolean(this.accessToken || this.refreshToken || this.cookieHeader());
  }

  setTokens(tokens: {
    accessToken?: string | null;
    refreshToken?: string | null;
  }): void {
    if (tokens.accessToken !== undefined) this.accessToken = tokens.accessToken;
    if (tokens.refreshToken !== undefined)
      this.refreshToken = tokens.refreshToken;
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }

  setCsrfToken(token: string | null | undefined): void {
    this.csrfToken =
      typeof token === "string" && token.trim().length > 0
        ? token.trim()
        : null;
  }

  collectCsrfTokens(): string[] {
    const tokens = new Set<string>();
    if (this.csrfToken) tokens.add(this.csrfToken);
    for (const cookie of this.cookies) {
      const parsed = parseSetCookie(cookie);
      if (parsed?.name === CSRF_COOKIE && parsed.value) {
        tokens.add(parsed.value);
      }
    }
    return [...tokens];
  }

  ingestSetCookie(header: string[] | string | undefined): void {
    if (!header) return;
    const headers = Array.isArray(header) ? header : [header];
    for (const raw of headers) {
      const parsed = parseSetCookie(raw);
      if (!parsed) continue;
      this.cookies = this.cookies.filter(
        (existing) => !existing.startsWith(`${parsed.name}=`),
      );
      this.cookies.push(`${parsed.name}=${parsed.value}`);
      if (parsed.name === CSRF_COOKIE) this.setCsrfToken(parsed.value);
    }
  }

  cookieHeader(): string | undefined {
    return this.cookies.length > 0 ? this.cookies.join("; ") : undefined;
  }
}

function defaultDeviceName(client: ClientType): string {
  if (client === "ios") return "App on iOS";
  if (client === "android") return "App on Android";
  if (typeof process !== "undefined" && process.platform) {
    const os =
      process.platform === "darwin"
        ? "macOS"
        : process.platform === "win32"
          ? "Windows"
          : process.platform === "linux"
            ? "Linux"
            : "Unknown OS";
    return `Web on ${os}`;
  }
  return "Web on Unknown OS";
}
