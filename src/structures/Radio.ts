import type { IsoDate, LiteralUnion, Snowflake } from "../util/types.js";
import type { User } from "./User.js";

export type RadioRole = LiteralUnion<"HOST" | "SPEAKER" | "LISTENER">;

export interface RadioParticipant {
  userId: Snowflake;
  role: RadioRole;
  muted?: boolean;
  joinedAt: IsoDate;
  user?: User;
}

export interface RadioSpace {
  id: Snowflake;
  hostId: Snowflake;
  title: string;
  description?: string | null;
  isLive: boolean;
  isRecording?: boolean;
  participantsCount?: number;
  startedAt?: IsoDate | null;
  endedAt?: IsoDate | null;
  createdAt: IsoDate;
  host?: User;
  participants?: RadioParticipant[];
  settings?: RadioSettings;
  [extra: string]: unknown;
}

export interface RadioSettings {
  recordingEnabled?: boolean;
  reactionsEnabled?: boolean;
  chatEnabled?: boolean;
  speakerApprovalRequired?: boolean;
  maxSpeakers?: number;
  [extra: string]: unknown;
}

export interface RadioMessage {
  id: Snowflake;
  spaceId: Snowflake;
  senderId: Snowflake;
  content: string;
  createdAt: IsoDate;
  sender?: User;
}

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}
