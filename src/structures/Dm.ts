import type { IsoDate, Snowflake } from "../util/types.js";
import type { MediaInput } from "../util/form.js";
import type { Poll } from "./Post.js";
import type { User } from "./User.js";

export interface DmGroup {
  id: Snowflake;
  name?: string | null;
  isGroup?: boolean;
  members: User[];
  lastMessage?: DmMessage | null;
  messages?: DmMessage[];
  unreadCount?: number;
  canSend?: boolean;
  sendDisabledReason?: string | null;
  activeCall?: ActiveCall | null;
  isRequest?: boolean;
  updatedAt?: IsoDate;
  [extra: string]: unknown;
}

export interface ActiveCall {
  id: string;
  startedAt: IsoDate;
  participants?: Snowflake[];
}

export interface DmMessage {
  id: Snowflake;
  groupId: Snowflake;
  senderId: Snowflake;
  content: string;
  replyToId?: Snowflake | null;
  attachmentUrls: string[];
  attachmentTypes: string[];
  attachmentAlts: string[];
  attachmentSpoilerFlags: boolean[];
  attachmentR18Flags: boolean[];
  isDeleted?: boolean;
  createdAt: IsoDate;
  editedAt?: IsoDate | null;
  sender?: User;
  reactions?: Array<{ emoji: string; userId: Snowflake }>;
  poll?: Poll | null;
  [extra: string]: unknown;
}

export interface DmFile {
  id?: Snowflake | string;
  groupId?: Snowflake;
  messageId?: Snowflake;
  url: string;
  name?: string;
  type?: string;
  size?: number;
  uploadedAt?: IsoDate;
  [extra: string]: unknown;
}

export interface DmGroupSettings {
  notificationsEnabled?: boolean;
  readReceiptsEnabled?: boolean;
  callPermission?: string;
  [extra: string]: unknown;
}

export interface DmAttachment {
  file: MediaInput;
  alt?: string;
  spoiler?: boolean;
  r18?: boolean;
}

export interface SendDmInput {
  content?: string;
  replyToId?: Snowflake | string;
  attachments?: DmAttachment[];
  poll?: { options: string[]; durationHours?: number };
}
