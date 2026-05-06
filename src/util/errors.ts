import type { AxiosError } from "axios";
import type { JsonObject, JsonValue } from "./types.js";

export type KarotterHttpStatus =
  | 400
  | 401
  | 403
  | 404
  | 409
  | 422
  | 429
  | 500
  | 502
  | 503
  | 504;

export type KarotterErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "ACCOUNT_BANNED"
  | (string & {});

export interface KarotterErrorOptions {
  status?: number | undefined;
  code?: KarotterErrorCode | undefined;
  data?: JsonValue | undefined;
  cause?: unknown;
}

export class KarotterError extends Error {
  override readonly name: string = "KarotterError";
  readonly status?: number;
  readonly code?: KarotterErrorCode;
  readonly data?: JsonValue;
  readonly cause?: unknown;

  constructor(message: string, options: KarotterErrorOptions = {}) {
    super(message);
    if (options.status !== undefined) this.status = options.status;
    if (options.code !== undefined) this.code = options.code;
    if (options.data !== undefined) this.data = options.data;
    if (options.cause !== undefined) this.cause = options.cause;
  }
}

export class AuthError extends KarotterError {
  override readonly name: string = "AuthError";
}

export class BadRequestError extends KarotterError {
  override readonly name: string = "BadRequestError";
}

export class ForbiddenError extends KarotterError {
  override readonly name: string = "ForbiddenError";
}

export class NotFoundError extends KarotterError {
  override readonly name: string = "NotFoundError";
}

export class ConflictError extends KarotterError {
  override readonly name: string = "ConflictError";
}

export class ValidationError extends BadRequestError {
  override readonly name: string = "ValidationError";
}

export class RateLimitError extends KarotterError {
  override readonly name: string = "RateLimitError";
  readonly retryAfterMs?: number;

  constructor(
    message: string,
    options: KarotterErrorOptions & { retryAfterMs?: number } = {},
  ) {
    super(message, options);
    if (options.retryAfterMs !== undefined) this.retryAfterMs = options.retryAfterMs;
  }
}

export class BannedError extends AuthError {
  override readonly name: string = "BannedError";
  readonly bannedUntil?: string;
  readonly banReason?: string;

  constructor(
    message: string,
    options: KarotterErrorOptions & {
      bannedUntil?: string;
      banReason?: string;
    } = {},
  ) {
    super(message, options);
    if (options.bannedUntil !== undefined) this.bannedUntil = options.bannedUntil;
    if (options.banReason !== undefined) this.banReason = options.banReason;
  }
}

export class TurnstileError extends KarotterError {
  override readonly name: string = "TurnstileError";
}

export class ServerError extends KarotterError {
  override readonly name: string = "ServerError";
}

export class NetworkError extends KarotterError {
  override readonly name: string = "NetworkError";
}

export class TimeoutError extends NetworkError {
  override readonly name: string = "TimeoutError";
}

interface ServerErrorBody extends JsonObject {
  error?: JsonValue | undefined;
  message?: JsonValue | undefined;
  code?: JsonValue | undefined;
  status?: JsonValue | undefined;
  bannedUntil?: JsonValue | undefined;
  banReason?: JsonValue | undefined;
  errors?: JsonValue | undefined;
}

const str = (value: JsonValue | undefined): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

export function fromAxiosError(error: AxiosError): KarotterError {
  if (!error.response) {
    const code =
      error.code === "ECONNABORTED" || error.message.toLowerCase().includes("timeout")
        ? "TIMEOUT"
        : "NETWORK_ERROR";
    const ErrorClass = code === "TIMEOUT" ? TimeoutError : NetworkError;
    return new ErrorClass(error.message || "Karotter network request failed", {
      code,
      cause: error,
    });
  }

  const status = error.response?.status;
  const data = normalizeErrorData(error.response?.data);
  const message =
    str(data?.error) ??
    str(data?.message) ??
    error.message ??
    "Karotter request failed";
  const code = str(data?.code) as KarotterErrorCode | undefined;

  if (status === 403 && code === "ACCOUNT_BANNED") {
    const opts: ConstructorParameters<typeof BannedError>[1] = {
      cause: error,
    };
    if (status !== undefined) opts.status = status;
    if (code !== undefined) opts.code = code;
    if (data !== undefined) opts.data = data;
    const bannedUntil = str(data?.bannedUntil);
    const banReason = str(data?.banReason);
    if (bannedUntil) opts.bannedUntil = bannedUntil;
    if (banReason) opts.banReason = banReason;
    return new BannedError(message, opts);
  }

  if (status === 401) {
    return new AuthError(message, {
      status,
      code: code ?? "UNAUTHORIZED",
      data,
      cause: error,
    });
  }

  if (status === 400) {
    const ErrorClass = data?.errors !== undefined ? ValidationError : BadRequestError;
    return new ErrorClass(message, {
      status,
      code: code ?? (data?.errors !== undefined ? "VALIDATION_FAILED" : "BAD_REQUEST"),
      data,
      cause: error,
    });
  }

  if (status === 403) {
    return new ForbiddenError(message, {
      status,
      code: code ?? "FORBIDDEN",
      data,
      cause: error,
    });
  }

  if (status === 404) {
    return new NotFoundError(message, {
      status,
      code: code ?? "NOT_FOUND",
      data,
      cause: error,
    });
  }

  if (status === 409) {
    return new ConflictError(message, {
      status,
      code: code ?? "CONFLICT",
      data,
      cause: error,
    });
  }

  if (status === 422) {
    return new ValidationError(message, {
      status,
      code: code ?? "VALIDATION_FAILED",
      data,
      cause: error,
    });
  }

  if (status === 429) {
    const retryAfterMs = parseRetryAfterMs(
      error.response?.headers?.["retry-after"] ??
        error.response?.headers?.["ratelimit-reset"],
    );
    const opts: ConstructorParameters<typeof RateLimitError>[1] = {
      cause: error,
    };
    if (status !== undefined) opts.status = status;
    opts.code = code ?? "RATE_LIMITED";
    if (data !== undefined) opts.data = data;
    if (retryAfterMs !== undefined) opts.retryAfterMs = retryAfterMs;
    return new RateLimitError(message, opts);
  }

  if (status !== undefined && status >= 500) {
    return new ServerError(message, {
      status,
      code: code ?? "SERVER_ERROR",
      data,
      cause: error,
    });
  }

  return new KarotterError(message, { status, code, data, cause: error });
}

function normalizeErrorData(data: unknown): ServerErrorBody | undefined {
  if (isJsonObject(data)) return data;
  if (typeof data === "string" && data.length > 0) return { error: data };
  return undefined;
}

function isJsonObject(value: unknown): value is JsonObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parseRetryAfterMs(value: unknown): number | undefined {
  const header = Array.isArray(value) ? value[0] : value;
  if (typeof header !== "string" || header.length === 0) return undefined;
  if (/^\d+$/.test(header)) return Number(header) * 1000;
  const retryAt = Date.parse(header);
  if (Number.isNaN(retryAt)) return undefined;
  return Math.max(0, retryAt - Date.now());
}
