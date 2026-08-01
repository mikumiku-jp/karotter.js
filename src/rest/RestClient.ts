import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { AuthStore, type AuthStoreOptions } from "./AuthStore.js";
import {
  KarotterError,
  fromAxiosError,
} from "../util/errors.js";
import type { ClientType, QueryParams } from "../util/types.js";

export const DEFAULT_REST_BASE = "https://api.karotter.com";
export const DEFAULT_REST_TIMEOUT_MS = 15000;
export const REFRESH_COOLDOWN_MS = 15000;

const SKIP_AUTO_REFRESH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/me",
  "/auth/csrf-token",
  "/auth/refresh",
  "/auth/refresh-token",
  "/auth/logout",
];

export interface RestClientOptions extends AuthStoreOptions {
  baseUrl?: string;
  timeoutMs?: number;
  userAgent?: string;
  acceptLanguage?: string;
  requestedWith?: string | null;
  autoCsrfRetry?: boolean;
  autoTokenRefresh?: boolean;
  axiosInstance?: AxiosInstance;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  authorization?: string | null;
  params?: QueryParams;
  clientType?: ClientType;
  requestedWith?: string | null;
  deviceId?: string;
  signal?: AbortSignal;
  responseType?: AxiosRequestConfig["responseType"];
  onUploadProgress?: AxiosRequestConfig["onUploadProgress"];
  onDownloadProgress?: AxiosRequestConfig["onDownloadProgress"];
  validateStatus?: AxiosRequestConfig["validateStatus"];
  timeoutMs?: number;
  data?: unknown;
  bypassAuthRetry?: boolean;
}

interface RetryFlags {
  _csrfRetried?: boolean;
  _refreshRetried?: boolean;
  _bypassAuthRetry?: boolean;
  _skipClientHeaders?: boolean;
  _clientType?: ClientType;
  _requestedWith?: string | null;
  _deviceId?: string;
  _authorization?: string | null;
}

type AugmentedConfig = InternalAxiosRequestConfig & RetryFlags;

export class RestClient {
  readonly baseUrl: string;
  readonly auth: AuthStore;
  readonly axios: AxiosInstance;
  readonly autoCsrfRetry: boolean;
  readonly autoTokenRefresh: boolean;
  readonly requestedWith: string | null;
  readonly usesDefaultAxiosInstance: boolean;

  private refreshPromise: Promise<void> | null = null;
  private refreshLastFailureAt = 0;

  constructor(options: RestClientOptions = {}) {
    this.baseUrl = stripTrailingSlash(options.baseUrl ?? DEFAULT_REST_BASE);
    this.auth = new AuthStore(options);
    this.autoCsrfRetry = options.autoCsrfRetry ?? true;
    this.autoTokenRefresh = options.autoTokenRefresh ?? true;
    this.usesDefaultAxiosInstance = options.axiosInstance === undefined;
    this.requestedWith =
      options.requestedWith !== undefined
        ? options.requestedWith
        : this.auth.clientType === "android"
          ? "jp.karon.karotter"
          : null;
    this.axios =
      options.axiosInstance ??
      axios.create({
        baseURL: `${this.baseUrl}/api`,
        timeout: options.timeoutMs ?? DEFAULT_REST_TIMEOUT_MS,
        withCredentials: true,
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
          ...(options.userAgent ? { "User-Agent": options.userAgent } : {}),
          ...(options.acceptLanguage
            ? { "Accept-Language": options.acceptLanguage }
            : {}),
        },
      });

    this.axios.interceptors.request.use((config) =>
      this.onRequest(config as AugmentedConfig),
    );
    this.axios.interceptors.response.use(
      (response) => this.onResponse(response),
      (error) => this.onResponseError(error as AxiosError),
    );
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.run<T>("GET", path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.run<T>("POST", path, body, options);
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.run<T>("PUT", path, body, options);
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.run<T>("PATCH", path, body, options);
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.run<T>("DELETE", path, options?.data, options);
  }

  async refreshTokens(): Promise<void> {
    try {
      await this.runRefresh();
    } catch (error) {
      throw normalizeRequestError(error);
    }
  }

  async preflight(
    path: string,
    method: string,
    requestHeaders: readonly string[],
    options?: RequestOptions,
  ): Promise<void> {
    const config: AxiosRequestConfig & RetryFlags = {
      method: "OPTIONS",
      url: path,
      headers: {
        Accept: "*/*",
        ...options?.headers,
        "Access-Control-Request-Method": method,
        "Access-Control-Request-Headers": requestHeaders.join(","),
      },
      _skipClientHeaders: true,
      _bypassAuthRetry: true,
    };
    try {
      await this.axios.request(config);
    } catch (error) {
      throw normalizeRequestError(error);
    }
  }

  async ensureCsrfToken(options?: RequestOptions): Promise<void> {
    if (this.auth.collectCsrfTokens().length > 0) return;
    try {
      await this.refreshCsrf(options);
    } catch (error) {
      throw normalizeRequestError(error);
    }
  }

  private async run<T>(
    method: string,
    url: string,
    data: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const config: AxiosRequestConfig = { method, url };
    if (data !== undefined) config.data = data;
    if (options?.headers) config.headers = options.headers;
    if (options && "authorization" in options)
      (config as AugmentedConfig)._authorization = options.authorization;
    if (options?.params) config.params = options.params;
    if (options?.clientType)
      (config as AugmentedConfig)._clientType = options.clientType;
    if (options && "requestedWith" in options)
      (config as AugmentedConfig)._requestedWith = options.requestedWith;
    if (options?.deviceId)
      (config as AugmentedConfig)._deviceId = options.deviceId;
    if (options?.signal) config.signal = options.signal;
    if (options?.responseType) config.responseType = options.responseType;
    if (options?.onUploadProgress) config.onUploadProgress = options.onUploadProgress;
    if (options?.onDownloadProgress) config.onDownloadProgress = options.onDownloadProgress;
    if (options?.validateStatus) config.validateStatus = options.validateStatus;
    if (typeof options?.timeoutMs === "number") config.timeout = options.timeoutMs;
    if (options?.bypassAuthRetry)
      (config as AugmentedConfig)._bypassAuthRetry = true;

    try {
      const response = await this.axios.request<T>(config);
      return response.data;
    } catch (error) {
      throw normalizeRequestError(error);
    }
  }

  private onRequest(config: AugmentedConfig): AugmentedConfig {
    const headers = (config.headers ?? {}) as Record<string, string>;
    if (config._skipClientHeaders) {
      delete headers["Content-Type"];
      delete headers["content-type"];
      delete headers["Authorization"];
      delete headers["Cookie"];
      delete headers["X-Requested-With"];
      delete headers["x-client-type"];
      delete headers["x-device-id"];
      delete headers["x-csrf-token"];
      config.headers = headers as InternalAxiosRequestConfig["headers"];
      return config;
    }
    if (isFormData(config.data)) {
      delete headers["Content-Type"];
      delete headers["content-type"];
    }
    const clientType = config._clientType ?? this.auth.clientType;
    const requestedWith =
      config._requestedWith !== undefined
        ? config._requestedWith
        : clientType === this.auth.clientType
          ? this.requestedWith
          : clientType === "android"
            ? "jp.karon.karotter"
            : null;
    headers["x-client-type"] = clientType;
    headers["x-device-id"] = config._deviceId ?? this.auth.deviceId;
    if (requestedWith) {
      headers["X-Requested-With"] = requestedWith;
    } else {
      delete headers["X-Requested-With"];
    }
    const csrf = this.auth.collectCsrfTokens();
    if (csrf.length > 0) headers["x-csrf-token"] = csrf.join(",");
    else delete headers["x-csrf-token"];
    if (config._authorization !== undefined) {
      if (config._authorization) {
        headers["Authorization"] = config._authorization;
      } else {
        delete headers["Authorization"];
      }
    } else if (this.auth.accessToken) {
      headers["Authorization"] = `Bearer ${this.auth.accessToken}`;
    } else {
      delete headers["Authorization"];
    }
    const cookie = this.auth.cookieHeader();
    if (cookie) headers["Cookie"] = cookie;
    config.headers = headers as InternalAxiosRequestConfig["headers"];
    return config;
  }

  private onResponse(response: AxiosResponse): AxiosResponse {
    this.auth.ingestSetCookie(
      response.headers?.["set-cookie"] as string[] | string | undefined,
    );
    const data = response.data as { csrfToken?: unknown } | undefined;
    if (data && typeof data.csrfToken === "string") {
      this.auth.setCsrfToken(data.csrfToken);
    }
    return response;
  }

  private async onResponseError(error: AxiosError): Promise<AxiosResponse> {
    const config = error.config as AugmentedConfig | undefined;
    if (!config || config._bypassAuthRetry) throw error;
    const status = error.response?.status;
    const url = config.url ?? "";
    const data = error.response?.data as { error?: unknown } | undefined;

    if (this.shouldSkipAutoRetry(url)) throw error;

    if (
      this.autoCsrfRetry &&
      status === 403 &&
      isCsrfErrorMessage(data) &&
      !config._csrfRetried
    ) {
      config._csrfRetried = true;
      try {
        await this.refreshCsrf();
        const tokens = this.auth.collectCsrfTokens();
        if (tokens.length > 0) {
          config.headers = config.headers ?? {};
          (config.headers as Record<string, string>)["x-csrf-token"] =
            tokens.join(",");
        }
        return this.axios.request(config);
      } catch {
        throw error;
      }
    }

    if (
      this.autoTokenRefresh &&
      status === 401 &&
      !config._refreshRetried &&
      this.auth.isAuthenticated
    ) {
      config._refreshRetried = true;
      try {
        await this.runRefresh();
        return this.axios.request(config);
      } catch (refreshError) {
        this.auth.clearTokens();
        throw refreshError;
      }
    }

    throw error;
  }

  private shouldSkipAutoRetry(url: string): boolean {
    const path = normalizePath(url);
    return SKIP_AUTO_REFRESH_PATHS.includes(path);
  }

  private async refreshCsrf(options?: RequestOptions): Promise<void> {
    const response = await this.axios.request<{ csrfToken?: string }>({
      method: "GET",
      url: "/auth/csrf-token",
      headers: options?.headers,
      _clientType: options?.clientType,
      _requestedWith:
        options && "requestedWith" in options ? options.requestedWith : undefined,
      _deviceId: options?.deviceId,
      _bypassAuthRetry: true,
    } as AugmentedConfig);
    if (typeof response.data.csrfToken === "string") {
      this.auth.setCsrfToken(response.data.csrfToken);
    }
  }

  private async runRefresh(): Promise<void> {
    if (Date.now() - this.refreshLastFailureAt < REFRESH_COOLDOWN_MS) {
      throw new KarotterError("Refresh cooldown active", {
        code: "REFRESH_COOLDOWN",
      });
    }
    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        try {
          await this.callRefreshEndpoint();
          this.refreshLastFailureAt = 0;
        } catch (err) {
          this.refreshLastFailureAt = Date.now();
          throw err;
        } finally {
          this.refreshPromise = null;
        }
      })();
    }
    await this.refreshPromise;
  }

  private async callRefreshEndpoint(): Promise<void> {
    const body: Record<string, string> = {
      deviceId: this.auth.deviceId,
      clientType: this.auth.clientType,
      deviceName: this.auth.deviceName,
    };
    if (this.auth.refreshToken) body["refreshToken"] = this.auth.refreshToken;

    const response = await this.axios.request<{
      accessToken?: string;
      refreshToken?: string;
      sessionId?: string;
    }>({
      method: "POST",
      url: "/auth/refresh-token",
      data: body,
      _bypassAuthRetry: true,
    } as AugmentedConfig);

    this.auth.setTokens({
      accessToken: response.data.accessToken ?? null,
      refreshToken: response.data.refreshToken ?? this.auth.refreshToken,
    });
  }
}

function isFormData(payload: unknown): boolean {
  if (!payload) return false;
  if (typeof FormData !== "undefined" && payload instanceof FormData) return true;
  return (
    (payload as { constructor?: { name?: string } })?.constructor?.name ===
    "FormData"
  );
}

function isCsrfErrorMessage(data: { error?: unknown } | undefined): boolean {
  return typeof data?.error === "string" && data.error.includes("CSRF");
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizePath(url: string): string {
  if (url.length === 0) return "";
  try {
    return new URL(url, "https://karotter.invalid").pathname;
  } catch {
    return url.split("?")[0] ?? url;
  }
}

function normalizeRequestError(error: unknown): KarotterError {
  if (error instanceof KarotterError) return error;
  if (axios.isAxiosError(error)) return fromAxiosError(error);
  return new KarotterError("Karotter request failed", { cause: error });
}
