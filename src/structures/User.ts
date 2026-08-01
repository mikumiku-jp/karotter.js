import type {
  Gender,
  IsoDate,
  Snowflake,
  UserOnlineStatus,
} from "../util/types.js";
import type { Post } from "./Post.js";
import type {
  PremiumBadgeColor,
  SubscriptionPlanCode,
  SubscriptionStatus,
} from "./Subscription.js";

export type ProfileVisibility =
  | "PUBLIC"
  | "FOLLOWERS"
  | "PRIVATE"
  | (string & {});

export type DmRequestPolicy =
  | "EVERYONE"
  | "VERIFIED_ONLY"
  | "FOLLOWERS_ONLY"
  | "NONE"
  | (string & {});

export interface UserRelationship {
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  isBlocked?: boolean;
  isBlockedBy?: boolean;
  isMuted?: boolean;
  hasPendingRequest?: boolean;
}

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
  gender?: Gender;
  isBotAccount?: boolean;
  isParodyAccount?: boolean;
  isPrivate?: boolean;
  hideProfileFromMinors?: boolean;
  profileMinimumAge?: number | null;
  profileMaximumAge?: number | null;
  adminForceProfileMinimumAge?: number | null;
  adminForceProfileMaximumAge?: number | null;
  onlineStatus?: UserOnlineStatus;
  statusMessage?: string | null;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  experience?: number;
  levelEnabled?: boolean;
  officialMark?: OfficialMarkColor[] | OfficialMarkColor | null;
  isPremium?: boolean;
  premiumUntil?: IsoDate | null;
  subscriptionPlan?: SubscriptionPlanCode;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionActiveUntil?: IsoDate | null;
  subscriptionCancelAtPeriodEnd?: boolean;
  subscriptionBadgeColors?: PremiumBadgeColor[];
  showSubscriptionBadges?: boolean;
  showPlusBadge?: boolean;
  showProBadge?: boolean;
  showRedBadge?: boolean;
  showGreenBadge?: boolean;
  showProfileDecoration?: boolean;
  showCardDecoration?: boolean;
  premiumBadgeColor?: PremiumBadgeColor;
  profileAccentColor?: string | null;
  cardAccentColor?: string | null;
  pinnedPostId?: Snowflake | null;
  pinnedPostIds?: Snowflake[];
  pinnedPostLimit?: number;
  avatarFrameId?: Snowflake | null;
  adminForceBot?: boolean;
  adminForceParody?: boolean;
  adminForceHidden?: boolean;
  adminForceR18?: boolean;
  isBanned?: boolean;
  banReason?: string | null;
  bannedUntil?: IsoDate | null;
  isRestricted?: boolean;
  emailVerified?: boolean;
  isAdmin?: boolean;
  birthday?: string | null;
  displayBirthday?: string | null;
  birthdayVisibility?: ProfileVisibility;
  birthdayBalloonsEnabled?: boolean;
  createdAt?: IsoDate;
  [extra: string]: unknown;
}

export interface UserDetail extends UserRelationship {
  user: User;
  relationship?: UserRelationship;
  isPostNotificationsEnabled?: boolean;
  isRekarotHidden?: boolean;
  hasBlocked?: boolean;
  isBlockedBy?: boolean;
  mutualFollowersCount?: number;
  profileUnavailableReason?: string | null;
  profileUnavailableDetails?: string[];
  pinnedPost?: Post | null;
  pinnedPosts?: Post[];
  [extra: string]: unknown;
}

export interface CurrentUser extends User {
  email?: string;
  showOnlineStatus?: boolean;
  onlineStatusVisibility?: ProfileVisibility;
  showLikedPosts?: boolean;
  showReadReceipts?: boolean;
  directMessagesEnabled?: boolean;
  questionsEnabled?: boolean;
  giftsEnabled?: boolean;
  dmRequestPolicy?: DmRequestPolicy;
  legalQuizPassed?: boolean;
  hasPassword?: boolean;
  linkedOAuthProviders?: string[];
  mutedKeywords?: string[];
  notifyLikes?: boolean;
  notifyRekarots?: boolean;
  notifyReplies?: boolean;
  notifyMentions?: boolean;
  notifyFollows?: boolean;
  notifyQuotes?: boolean;
  notifyReactions?: boolean;
  notifyDMs?: boolean;
  notifyBoardActivity?: boolean;
  notifyNewsOnLaunch?: boolean;
  notificationToastEnabled?: boolean;
  notificationToastPosition?: string;
  notificationToastDurationMs?: number;
  showReactions?: boolean;
  notificationMuteNonFollowing?: boolean;
  notificationMuteNonFollowers?: boolean;
  notificationMuteNewAccounts?: boolean;
  notificationMuteNoAvatar?: boolean;
  showHiddenPosts?: boolean;
  showParodyAccounts?: boolean;
  showBotAccounts?: boolean;
  showR18Content?: boolean;
  showRepliesInTimeline?: boolean;
  showRekarotsInTimeline?: boolean;
  hideUnfollowedRekarotsInTimeline?: boolean;
  defaultExcludeReplyTargets?: boolean;
  pushNotificationsEnabled?: boolean;
  twoFactorEnabled?: boolean;
  legalNoticeSeenVersion?: string | null;
}
