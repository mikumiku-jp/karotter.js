import type { RequestOptions, RestClient } from "../RestClient.js";
import { registerWithAndroidTransport } from "../AndroidRegisterTransport.js";
import type {
  CsrfToken,
  LoginInput,
  LoginResult,
  RegisterInput,
  SessionUnreadSnapshot,
  SessionInfo,
  SwitchSessionInput,
  SwitchSessionResult,
} from "../../structures/Auth.js";
import type { CurrentUser } from "../../structures/User.js";
import type { MessageEnvelope } from "../../util/types.js";
import { assertPositiveInteger } from "../../util/validation.js";
import { encodeId } from "../utils.js";

export const TURNSTILE_SITEKEY = "0x4AAAAAACujb-w-3YVWR1zA";
export const OAUTH_PROVIDERS = ["google", "discord"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];
export type OAuthMode = "login" | "register";

const ANDROID_WEBVIEW_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 16; Pixel 10 Build/BE2A.250530.026.F3; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/133.0.6943.137 Mobile Safari/537.36";
const ANDROID_REGISTER_STARTED_OFFSET_MS = 120_000;
const DEFAULT_REGISTER_GENDER: RegisterInput["gender"] = "OTHER";
const DEFAULT_REGISTER_BIRTHDAY = "2000-01-01";

const ANDROID_REGISTER_OPTIONS: RequestOptions = {
  clientType: "android",
  requestedWith: null,
  headers: {
    Origin: "https://localhost",
    Referer: "https://localhost/",
    "User-Agent": ANDROID_WEBVIEW_USER_AGENT,
    "sec-ch-ua":
      '"Not(A:Brand";v="99", "Android WebView";v="133", "Chromium";v="133"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
  },
};

const ANDROID_REGISTER_PREFLIGHT_OPTIONS: RequestOptions = {
  headers: {
    Origin: "https://localhost",
    "Sec-Fetch-Mode": "cors",
    "User-Agent": ANDROID_WEBVIEW_USER_AGENT,
  },
};

const ANDROID_WEBVIEW_AUTH_OPTIONS: RequestOptions = {
  clientType: "android",
  requestedWith: null,
  headers: {
    Origin: "https://localhost",
    Referer: "https://localhost/",
    "User-Agent": ANDROID_WEBVIEW_USER_AGENT,
    "sec-ch-ua":
      '"Not(A:Brand";v="99", "Android WebView";v="133", "Chromium";v="133"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
  },
};

export interface OAuthStartUrlOptions {
  provider: OAuthProvider;
  mode: OAuthMode;
  frontendOrigin?: string;
  next?: string;
  addAccount?: boolean;
}

export class AuthApi {
  constructor(private readonly rest: RestClient) {}

  async login(input: LoginInput): Promise<LoginResult> {
    const loginOptions =
      this.rest.auth.clientType === "android"
        ? ANDROID_WEBVIEW_AUTH_OPTIONS
        : undefined;
    const body = {
      ...input,
      deviceId: this.rest.auth.deviceId,
      clientType: this.rest.auth.clientType,
      deviceName: this.rest.auth.deviceName,
    };
    const result = await this.rest.post<LoginResult>(
      "/auth/login",
      body,
      loginOptions,
    );
    if (result.accessToken) {
      this.rest.auth.setTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken ?? this.rest.auth.refreshToken,
      });
    }
    return result;
  }

  async register(input: RegisterInput): Promise<LoginResult> {
    const {
      registerStartedAtMs,
      turnstileToken,
      birthday,
      email,
      username,
      gender,
      password,
      acceptTerms,
      acceptPrivacy,
    } = input;
    const registerOptions =
      turnstileToken === undefined ? ANDROID_REGISTER_OPTIONS : undefined;
    if (registerStartedAtMs !== undefined) {
      assertPositiveInteger(registerStartedAtMs, "registerStartedAtMs");
    }
    const resolvedBirthday =
      birthday === undefined ? DEFAULT_REGISTER_BIRTHDAY : birthday;
    const body = {
      email,
      username,
      gender: gender ?? DEFAULT_REGISTER_GENDER,
      password,
      birthday: resolvedBirthday.length > 0 ? resolvedBirthday : null,
      acceptTerms: acceptTerms ?? true,
      acceptPrivacy: acceptPrivacy ?? true,
      turnstileToken:
        turnstileToken ??
        (registerOptions || this.rest.auth.clientType !== "web"
          ? ""
          : undefined),
      _ts:
        registerStartedAtMs ??
        Date.now() - (registerOptions ? ANDROID_REGISTER_STARTED_OFFSET_MS : 0),
    };
    if (registerOptions && this.rest.usesDefaultAxiosInstance) {
      const result = await registerWithAndroidTransport(this.rest, body);
      if (result.accessToken) {
        this.rest.auth.setTokens({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken ?? this.rest.auth.refreshToken,
        });
      }
      return result;
    }
    await this.rest.ensureCsrfToken(registerOptions);
    if (registerOptions) {
      const preflightHeaders = this.rest.auth.accessToken
        ? ["authorization", "content-type", "x-client-type", "x-csrf-token", "x-device-id"]
        : ["content-type", "x-client-type", "x-csrf-token", "x-device-id"];
      await this.rest.preflight(
        "/auth/register",
        "POST",
        preflightHeaders,
        ANDROID_REGISTER_PREFLIGHT_OPTIONS,
      );
    }
    const result = await this.rest.post<LoginResult>(
      "/auth/register",
      body,
      registerOptions,
    );
    if (result.accessToken) {
      this.rest.auth.setTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken ?? this.rest.auth.refreshToken,
      });
    }
    return result;
  }

  async logout(): Promise<MessageEnvelope> {
    const response = await this.rest.post<MessageEnvelope>("/auth/logout", {
      deviceId: this.rest.auth.deviceId,
    });
    this.rest.auth.clearTokens();
    return response;
  }

  me(): Promise<CurrentUser> {
    return this.rest.get<CurrentUser>("/auth/me");
  }

  async getCsrfToken(): Promise<CsrfToken> {
    const response = await this.rest.get<CsrfToken>("/auth/csrf-token");
    if (response.csrfToken) this.rest.auth.setCsrfToken(response.csrfToken);
    return response;
  }

  async invalidateCsrfToken(): Promise<MessageEnvelope | undefined> {
    const response = await this.rest.delete<MessageEnvelope | undefined>(
      "/auth/csrf-token",
    );
    this.rest.auth.setCsrfToken(null);
    return response;
  }

  async refreshTokens(): Promise<{
    accessToken: string;
    refreshToken: string | null;
  }> {
    await this.rest.refreshTokens();
    return {
      accessToken: this.rest.auth.accessToken ?? "",
      refreshToken: this.rest.auth.refreshToken,
    };
  }

  sessions(): Promise<{ sessions: SessionInfo[] }> {
    return this.rest.get("/auth/sessions");
  }

  revokeSession(sessionId: string): Promise<MessageEnvelope> {
    return this.rest.delete(`/auth/sessions/${encodeId(sessionId)}`);
  }

  revokeOtherSessions(): Promise<
    MessageEnvelope & { revokedCount?: number }
  > {
    return this.rest.delete("/auth/sessions/others");
  }

  revokeAllSessions(): Promise<MessageEnvelope> {
    return this.rest.delete("/auth/sessions/all");
  }

  async switchSession(input: SwitchSessionInput): Promise<SwitchSessionResult> {
    const result = await this.rest.post<SwitchSessionResult>(
      "/auth/switch-session",
      input,
    );
    if (result.accessToken) {
      this.rest.auth.setTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken ?? this.rest.auth.refreshToken,
      });
    }
    return result;
  }

  unreadSnapshots(): Promise<{ snapshots: SessionUnreadSnapshot[] }> {
    return this.rest.post("/auth/session-unread-snapshots", {
      deviceId: this.rest.auth.deviceId,
    });
  }

  forgotPassword(email: string): Promise<MessageEnvelope> {
    return this.rest.post("/auth/forgot-password", { email });
  }

  resetPassword(token: string, password: string): Promise<MessageEnvelope> {
    return this.rest.post("/auth/reset-password", { token, password });
  }

  verifyEmail(token: string): Promise<MessageEnvelope> {
    return this.rest.post("/auth/verify-email", { token });
  }

  setEmail(email: string): Promise<{
    message: string;
    email: string;
    cooldownSeconds?: number;
  }> {
    return this.rest.post("/auth/me/email", { email });
  }

  resendVerificationEmail(): Promise<MessageEnvelope> {
    return this.rest.post("/auth/me/email/resend");
  }

  resendVerificationByEmail(email: string): Promise<MessageEnvelope> {
    return this.rest.post("/auth/resend-verification", { email });
  }

  buildOAuthStartUrl(options: OAuthStartUrlOptions): string {
    const url = new URL(
      `/api/auth/oauth/${options.provider}/start`,
      this.rest.baseUrl,
    );
    url.searchParams.set("mode", options.mode);
    if (options.frontendOrigin)
      url.searchParams.set("frontendOrigin", options.frontendOrigin);
    if (options.next) url.searchParams.set("next", options.next);
    if (options.addAccount) url.searchParams.set("addAccount", "1");
    return url.toString();
  }
}
