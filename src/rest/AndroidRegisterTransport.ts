import {
  Session,
  destroyTLS,
  initTLS,
} from "node-tls-client";
import type { OutgoingHttpHeaders } from "node:http";
import type { RestClient } from "./RestClient.js";
import type { LoginResult, RegisterInput } from "../structures/Auth.js";
import { BannedError, KarotterError } from "../util/errors.js";
import type { JsonObject, JsonValue } from "../util/types.js";

export interface AndroidRegisterBody {
  email: string;
  username: string;
  gender: RegisterInput["gender"] | undefined;
  password: string;
  birthday: string | null;
  acceptTerms: boolean | undefined;
  acceptPrivacy: boolean | undefined;
  turnstileToken: string | undefined;
  _ts: number;
}

const ANDROID_WEBVIEW_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 16; Pixel 10 Build/BE2A.250530.026.F3; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/133.0.6943.137 Mobile Safari/537.36";

const CURL_JA3 =
  "771,4867-4866-4865-52393-52392-52394-49200-49196-49192-49188-49172-49162-159-107-57-65413-196-136-129-157-61-53-192-132-49199-49195-49191-49187-49171-49161-158-103-51-190-69-156-60-47-186-65-49169-49159-5-4-49170-49160-22-10-255,43-51-0-11-10-13-16,29-23-24-25,0";

const CURL_H2_SETTINGS = {
  MAX_CONCURRENT_STREAMS: 100,
  INITIAL_WINDOW_SIZE: 10485760,
  ENABLE_PUSH: 0,
} as unknown as NonNullable<
  NonNullable<ConstructorParameters<typeof Session>[0]>["h2Settings"]
>;

const CURL_H2_SETTINGS_ORDER = [
  "MAX_CONCURRENT_STREAMS",
  "INITIAL_WINDOW_SIZE",
  "ENABLE_PUSH",
] as NonNullable<
  NonNullable<ConstructorParameters<typeof Session>[0]>["h2SettingsOrder"]
>;

const CURL_PSEUDO_HEADER_ORDER = [
  ":method",
  ":scheme",
  ":authority",
  ":path",
] as NonNullable<
  NonNullable<ConstructorParameters<typeof Session>[0]>["pseudoHeaderOrder"]
>;

const CURL_SIGNATURE_ALGORITHMS = [
  "PSSWithSHA512",
  "PKCS1WithSHA512",
  "ECDSAWithP521AndSHA512",
  "PSSWithSHA384",
  "PKCS1WithSHA384",
  "ECDSAWithP384AndSHA384",
  "PSSWithSHA256",
  "PKCS1WithSHA256",
  "ECDSAWithP256AndSHA256",
  "PKCS1WithSHA1",
  "ECDSAWithSHA1",
] as NonNullable<
  NonNullable<
    NonNullable<ConstructorParameters<typeof Session>[0]>["supportedSignatureAlgorithms"]
  >
>;

const CURL_SUPPORTED_VERSIONS = [
  "1.3",
  "1.2",
  "1.1",
  "1.0",
] as NonNullable<
  NonNullable<ConstructorParameters<typeof Session>[0]>["supportedVersions"]
>;

const CURL_KEY_SHARE_CURVES = ["X25519"] as NonNullable<
  NonNullable<ConstructorParameters<typeof Session>[0]>["keyShareCurves"]
>;

const CURL_TRANSPORT_OPTIONS = {
  disableKeepAlives: true,
  disableCompression: true,
  maxIdleConns: 0,
  maxIdleConnsPerHost: 0,
  maxConnsPerHost: 0,
  maxResponseHeaderBytes: 0,
  writeBufferSize: 0,
  readBufferSize: 0,
  idleConnTimeout: 0,
} as NonNullable<
  NonNullable<ConstructorParameters<typeof Session>[0]>["transportOptions"]
>;

const ANDROID_HEADER_ORDER = [
  "cookie",
  "accept",
  "content-type",
  "origin",
  "referer",
  "user-agent",
  "sec-ch-ua",
  "sec-ch-ua-mobile",
  "sec-ch-ua-platform",
  "x-client-type",
  "x-device-id",
  "x-csrf-token",
  "content-length",
];

let tlsUsers = 0;

export async function registerWithAndroidTransport(
  rest: RestClient,
  body: AndroidRegisterBody,
): Promise<LoginResult> {
  await initAndroidTls();
  try {
    let csrfToken = "";
    let csrfCookies: Record<string, string> = {};
    const csrfSession = createAndroidSession();

    try {
      const csrfResponse = await csrfSession.get(buildUrl(rest, "/auth/csrf-token"), {
        headers: androidPostHeaders(rest.auth.deviceId),
      });
      const csrfText = await csrfResponse.text();
      const csrfPayload = parseJson<{ csrfToken?: unknown }>(
        csrfResponse.status,
        csrfText,
      );
      if (typeof csrfPayload.csrfToken !== "string") {
        throw new KarotterError("Karotter CSRF token was not returned", {
          status: csrfResponse.status,
        });
      }
      csrfToken = csrfPayload.csrfToken;
      csrfCookies = csrfResponse.cookies;
      rest.auth.setCsrfToken(csrfToken);
    } finally {
      await csrfSession.close();
    }

    const registerSession = createAndroidSession();

    try {
      const registerResponse = await registerSession.post(
        buildUrl(rest, "/auth/register"),
        {
          headers: {
            ...androidPostHeaders(rest.auth.deviceId),
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify(body),
          cookies: csrfCookies,
        },
      );
      const responseText = await registerResponse.text();
      const result = parseJson<LoginResult>(registerResponse.status, responseText);
      if (registerResponse.status < 200 || registerResponse.status >= 300) {
        throw httpError(registerResponse.status, result);
      }
      for (const [name, value] of Object.entries(registerResponse.cookies)) {
        rest.auth.ingestSetCookie(`${name}=${value}`);
      }
      return result;
    } finally {
      await registerSession.close();
    }
  } finally {
    await destroyAndroidTls();
  }
}

function createAndroidSession(): Session {
  return new Session({
    ja3string: CURL_JA3,
    h2Settings: CURL_H2_SETTINGS,
    h2SettingsOrder: CURL_H2_SETTINGS_ORDER,
    pseudoHeaderOrder: CURL_PSEUDO_HEADER_ORDER,
    connectionFlow: 1048510465,
    supportedSignatureAlgorithms: CURL_SIGNATURE_ALGORITHMS,
    supportedVersions: CURL_SUPPORTED_VERSIONS,
    keyShareCurves: CURL_KEY_SHARE_CURVES,
    alpnProtocols: ["h2", "http/1.1"],
    transportOptions: CURL_TRANSPORT_OPTIONS,
    timeout: 15000,
    headerOrder: ANDROID_HEADER_ORDER as unknown as OutgoingHttpHeaders[],
  });
}

function buildUrl(rest: RestClient, path: string): string {
  return `${rest.baseUrl}/api${path}`;
}

function androidPostHeaders(deviceId: string): Record<string, string> {
  return {
    accept: "application/json, text/plain, */*",
    "content-type": "application/json",
    origin: "https://localhost",
    referer: "https://localhost/",
    "user-agent": ANDROID_WEBVIEW_USER_AGENT,
    "sec-ch-ua":
      '"Not(A:Brand";v="99", "Android WebView";v="133", "Chromium";v="133"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    "x-client-type": "android",
    "x-device-id": deviceId,
  };
}

function parseJson<T>(status: number, text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new KarotterError("Karotter response was not JSON", {
      status,
      cause: error,
    });
  }
}

function httpError(status: number, data: unknown): KarotterError {
  const jsonData = isJsonValue(data) ? data : undefined;
  const message =
    getStringField(data, "error") ??
    getStringField(data, "message") ??
    "Karotter request failed";
  const responseCode = getStringField(data, "code");
  if (status === 403 && responseCode === "ACCOUNT_BANNED") {
    const bannedUntil = getStringField(data, "bannedUntil");
    const banReason = getStringField(data, "banReason");
    return new BannedError(message, {
      status,
      code: "ACCOUNT_BANNED",
      data: jsonData,
      ...(bannedUntil ? { bannedUntil } : {}),
      ...(banReason ? { banReason } : {}),
    });
  }
  const code =
    responseCode ??
    (status === 400
      ? "BAD_REQUEST"
      : status === 401
        ? "UNAUTHORIZED"
        : status === 403
          ? "FORBIDDEN"
          : undefined);
  return new KarotterError(message, {
    status,
    code,
    data: jsonData,
  });
}

function getStringField(data: unknown, key: string): string | undefined {
  if (!data || typeof data !== "object" || !(key in data)) return undefined;
  const value = (data as Record<string, unknown>)[key];
  if (typeof value === "string" && value.length > 0) return value;
  return undefined;
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) return true;
  const valueType = typeof value;
  if (
    valueType === "string" ||
    valueType === "number" ||
    valueType === "boolean"
  ) {
    return true;
  }
  if (Array.isArray(value)) return value.every(isJsonValue);
  return isJsonObject(value);
}

function isJsonObject(value: unknown): value is JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((child) =>
    child === undefined ? true : isJsonValue(child),
  );
}
async function initAndroidTls(): Promise<void> {
  if (tlsUsers === 0) await initTLS();
  tlsUsers += 1;
}

async function destroyAndroidTls(): Promise<void> {
  tlsUsers = Math.max(0, tlsUsers - 1);
  if (tlsUsers === 0) await destroyTLS();
}
