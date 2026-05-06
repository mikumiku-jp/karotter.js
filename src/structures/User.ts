import type { IsoDate, Snowflake, UserOnlineStatus } from "../util/types.js";
import type { Post } from "./Post.js";

export type OfficialMarkColor =
  | "BLUE"
  | "YELLOW"
  | "BLACK"
  | "RED"
  | "GREEN"
  | "ORANGE"
  | (string & {});

export interface User {
  id: Snowflake;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  headerUrl?: string | null;
  bio?: string | null;
  websiteUrl?: string | null;
  location?: string | null;
  isBotAccount?: boolean;
  isParodyAccount?: boolean;
  isPrivate?: boolean;
  hideProfileFromMinors?: boolean;
  onlineStatus?: UserOnlineStatus;
  statusMessage?: string | null;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  officialMark?: OfficialMarkColor[] | OfficialMarkColor | null;
  avatarFrameId?: Snowflake | null;
  adminForceBot?: boolean;
  adminForceParody?: boolean;
  emailVerified?: boolean;
  isAdmin?: boolean;
  birthday?: string | null;
  createdAt?: IsoDate;
  [extra: string]: unknown;
}

export interface UserDetail {
  user: User;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  isBlocked?: boolean;
  isMuted?: boolean;
  followRequestSent?: boolean;
  hasBlockedYou?: boolean;
  pinnedPost?: Post | null;
  [extra: string]: unknown;
}

export interface CurrentUser extends User {
  email?: string;
  showLikedPosts?: boolean;
  showReadReceipts?: boolean;
  directMessagesEnabled?: boolean;
  onlineStatusVisibility?: string;
}
