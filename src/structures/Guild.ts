import type { IsoDate, PageInfo, Snowflake } from "../util/types.js";
import type { User } from "./User.js";
import type { ReactionEntry } from "./Post.js";

export interface Guild {
  id: Snowflake;
  name: string;
  [extra: string]: unknown;
}

export interface GuildChannel {
  id: Snowflake;
  guildId?: Snowflake;
  name?: string;
  type?: string;
  [extra: string]: unknown;
}

export interface GuildMember {
  user?: User;
  userId?: Snowflake;
  nick?: string | null;
  roles?: Snowflake[];
  [extra: string]: unknown;
}

export interface GuildRole {
  id: Snowflake;
  name: string;
  [extra: string]: unknown;
}

export interface GuildInvite {
  code: string;
  guild?: Guild;
  expiresAt?: IsoDate | null;
  [extra: string]: unknown;
}

export interface GuildEvent {
  id: Snowflake;
  name?: string;
  startsAt?: IsoDate;
  [extra: string]: unknown;
}

export interface GuildBan {
  user?: User;
  userId?: Snowflake;
  reason?: string | null;
  [extra: string]: unknown;
}

export interface GuildMessage {
  id: Snowflake;
  channelId?: Snowflake;
  authorId?: Snowflake;
  author?: User;
  content?: string;
  reactions?: ReactionEntry[];
  [extra: string]: unknown;
}

export interface GuildForumPost {
  id: Snowflake;
  channelId?: Snowflake;
  authorId?: Snowflake;
  author?: User;
  title?: string;
  content?: string;
  reactions?: ReactionEntry[];
  [extra: string]: unknown;
}

export interface GuildStage {
  channelId?: Snowflake;
  [extra: string]: unknown;
}

export interface GuildVoiceState {
  userId?: Snowflake;
  channelId?: Snowflake;
  [extra: string]: unknown;
}

export interface GuildBotApplication {
  id: Snowflake;
  name: string;
  [extra: string]: unknown;
}

export interface GuildApplicationCommand {
  id: Snowflake;
  name: string;
  description: string;
  guildId?: Snowflake | null;
  defaultMemberPermissions?: string | null;
  [extra: string]: unknown;
}

export type GuildCommandPermissionType = "ROLE" | "USER" | "CHANNEL";

export interface GuildCommandPermission {
  id: Snowflake;
  type: GuildCommandPermissionType;
  permission: boolean;
}

export interface GuildListResponse {
  guilds: Guild[];
  pagination?: PageInfo;
  [extra: string]: unknown;
}
