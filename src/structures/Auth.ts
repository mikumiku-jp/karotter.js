import type { Gender, IsoDate, Snowflake } from "../util/types.js";
import type { CurrentUser } from "./User.js";

export interface LoginInput {
  identifier: string;
  password: string;
  gender?: Gender;
}

export interface LoginResult {
  message?: string;
  accessToken: string;
  refreshToken?: string;
  sessionId?: string;
  deviceId?: string;
  user: CurrentUser;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  gender?: Gender;
  birthday?: string;
  acceptTerms?: boolean;
  acceptPrivacy?: boolean;
  turnstileToken?: string;
  registerStartedAtMs?: number;
}

export interface CsrfToken {
  csrfToken: string;
}

export interface SessionInfo {
  id: string;
  deviceId: string;
  clientType: string;
  deviceName: string;
  userAgent: string;
  createdAt: IsoDate;
  lastUsedAt: IsoDate;
  expiresAt: IsoDate;
  isCurrent: boolean;
}

export interface SessionUnreadSnapshot {
  sessionId?: string;
  userId?: Snowflake;
  notificationsCount?: number;
  dmCount?: number;
  unreadCount?: number;
  capturedAt?: IsoDate;
  [extra: string]: unknown;
}

export interface SwitchSessionInput {
  sessionId?: string;
  userId?: Snowflake;
}

export interface SwitchSessionResult {
  accessToken: string;
  refreshToken?: string;
  sessionId: string;
  user: CurrentUser;
}

export interface ApiKey {
  id: Snowflake;
  name: string;
  prefix: string;
  canReadPosts?: boolean;
  canCreatePosts?: boolean;
  canReadTimeline?: boolean;
  canReadFollows?: boolean;
  canWriteFollows?: boolean;
  requestsPerMinute?: number;
  createdAt: IsoDate;
  [extra: string]: unknown;
}
