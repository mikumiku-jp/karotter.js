import type {
  ClientType,
  Gender,
  IsoDate,
  Snowflake,
} from "../util/types.js";
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

export interface TwoFactorChallenge {
  twoFactorRequired: true;
  twoFactorToken: string;
}

export interface TwoFactorLoginInput {
  twoFactorToken: string;
  code: string;
}

export interface TwoFactorDisableInput {
  code?: string;
  password?: string;
}

export interface TwoFactorSetup {
  secret?: string;
  qrCode?: string;
  otpauthUrl?: string;
  [extra: string]: unknown;
}

export interface TwoFactorEnableResult {
  backupCodes: string[];
  message?: string;
}

export interface LegalQuizOption {
  id: string;
  label?: string;
  explanation?: string;
  [extra: string]: unknown;
}

export interface LegalQuizQuestion {
  id: string;
  options: LegalQuizOption[];
  [extra: string]: unknown;
}

export interface LegalQuiz {
  token: string;
  questions: LegalQuizQuestion[];
  [extra: string]: unknown;
}

export interface LegalQuizGradeInput {
  legalQuizToken: string;
  legalQuizAnswers: Record<string, string>;
}

export interface LegalQuizGradeResult {
  passed?: boolean;
  questions?: LegalQuizQuestion[];
  [extra: string]: unknown;
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

export interface SessionUnreadSnapshotInput {
  sessionIds?: string[];
  deviceId?: string;
}

export interface SwitchSessionInput {
  sessionId?: string;
  userId?: Snowflake;
  deviceId?: string;
  clientType?: ClientType;
  deviceName?: string;
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
