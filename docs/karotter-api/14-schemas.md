# データスキーマ

REST response と Realtime payload で共有する schema の集約。型は karotter.js が 2026-08-01 時点で保証する最小 field set。`[extra: string]: unknown` がある object は、サーバーが追加 field を返す可能性がある。

## Primitive・共通 envelope

```ts
type Snowflake = number;
type IsoDate = string;
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue | undefined };
type JsonArray = JsonValue[];

type ClientType = "web" | "ios" | "android";
type Gender = "MALE" | "FEMALE" | "OTHER";
type UserOnlineStatus = "ONLINE" | "OFFLINE" | "INVISIBLE" | string;
type Visibility = "PUBLIC" | "FOLLOWERS" | "CIRCLE";
type ReplyRestriction = "EVERYONE" | "FOLLOWING" | "MENTIONED" | "CIRCLE";

interface MessageEnvelope {
  message: string;
}

interface OffsetPagination {
  page?: number;
  limit?: number;
}

interface CursorPagination {
  limit?: number;
  cursor?: number | string;
}

type Pagination = OffsetPagination & CursorPagination;

interface PageInfo {
  page?: number;
  limit?: number;
  total?: number;
  pages?: number;
  hasNext?: boolean;
  nextCursor?: number | string | null;
}
```

Snowflake は JSON response では number。request path や一部 body は numeric string も受けられる。`IsoDate` は ISO 8601 string として扱い、文字列比較ではなく date parser を使う。

## User

```ts
type OfficialMarkColor =
  | "BLUE"
  | "YELLOW"
  | "BLACK"
  | "RED"
  | "GREEN"
  | "ORANGE"
  | string;

type ProfileVisibility = "PUBLIC" | "FOLLOWERS" | "PRIVATE" | string;
type DmRequestPolicy =
  | "EVERYONE"
  | "VERIFIED_ONLY"
  | "FOLLOWERS_ONLY"
  | "NONE"
  | string;

interface UserRelationship {
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  isBlocked?: boolean;
  isBlockedBy?: boolean;
  isMuted?: boolean;
  hasPendingRequest?: boolean;
}

interface User {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  headerUrl?: string | null;
  bio?: string | null;
  websiteUrl?: string | null;
  location?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER";
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
  premiumUntil?: string | null;
  subscriptionPlan?: "FREE" | "PLUS" | "PRO" | string;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionActiveUntil?: string | null;
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
  pinnedPostId?: number | null;
  pinnedPostIds?: number[];
  pinnedPostLimit?: number;
  avatarFrameId?: number | null;
  adminForceBot?: boolean;
  adminForceParody?: boolean;
  adminForceHidden?: boolean;
  adminForceR18?: boolean;
  isBanned?: boolean;
  banReason?: string | null;
  bannedUntil?: string | null;
  isRestricted?: boolean;
  emailVerified?: boolean;
  isAdmin?: boolean;
  birthday?: string | null;
  displayBirthday?: string | null;
  birthdayVisibility?: ProfileVisibility;
  birthdayBalloonsEnabled?: boolean;
  createdAt?: string;
  [extra: string]: unknown;
}

interface UserDetail extends UserRelationship {
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

interface CurrentUser extends User {
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
```

`email` などの account field は `CurrentUser` または管理 response にだけ現れる。他人の公開 `User` に存在する前提を置かない。購読・装飾 field は公開 profile に現れることがあるが、購入可否や投稿上限の判定には [Subscription API](./11-subscriptions-and-oauth.md) の `SubscriptionOverview.entitlements` を使う。

## Post・Poll・Reaction

```ts
type MediaType = "image" | "video" | string;
type ProReactionCode = `pro:${string}`;
type ReactionCode = ProReactionCode | string;


interface PollOption {
  id: number;
  text: string;
  imageUrl?: string | null;
  votes: number;
  voted?: boolean;
}

interface Poll {
  id: number;
  options: PollOption[];
  totalVotes: number;
  endsAt?: string | null;
  isAnonymous?: boolean;
  closed?: boolean;
}

interface ReactionEntry {
  emoji: ReactionCode;
  userId: number;
}

interface ReactionSummary {
  emoji: ReactionCode;
  count: number;
  reacted?: boolean;
}

interface MentionEntry {
  id: number;
  username: string;
}

interface HashtagEntry {
  id: number;
  name: string;
}

interface Post {
  id: number;
  content: string;
  authorId: number;
  parentId: number | null;
  quotedPostId: number | null;
  mediaUrls: string[];
  mediaTypes: MediaType[];
  mediaAlts: string[];
  mediaSpoilerFlags: boolean[];
  mediaR18Flags: boolean[];
  isAiGenerated?: boolean;
  isPromotional?: boolean;
  isR18?: boolean;
  hideFromMinors?: boolean;
  adminForceHidden?: boolean;
  adminForceR18?: boolean;
  visibility?: Visibility;
  replyRestriction?: ReplyRestriction;
  likesCount: number;
  rekarotsCount: number;
  repliesCount: number;
  viewsCount?: number;
  bookmarksCount?: number;
  reactionsCount?: number;
  liked?: boolean;
  rekaroted?: boolean;
  bookmarked?: boolean;
  isMutedByViewer?: boolean;
  hasBlockedAuthor?: boolean;
  isBlockedByAuthor?: boolean;
  canInteract?: boolean;
  canQuote?: boolean;
  embedUrl?: string | null;
  embedTitle?: string | null;
  embedDescription?: string | null;
  embedImage?: string | null;
  author: User;
  poll?: Poll | null;
  reactions?: ReactionEntry[];
  reactionSummary?: ReactionSummary[];
  mentions?: MentionEntry[];
  hashtags?: HashtagEntry[];
  createdAt: string;
  editedAt?: string | null;
  [extra: string]: unknown;
}
```

`mediaUrls`、`mediaTypes`、`mediaAlts`、spoiler/R18 flag は同じ index のメディアを表す。配列長が不正な response に備え、UI では各 metadata に安全な既定値を使う。

### 投稿補助 object

```ts
interface ScheduledPost {
  id: number;
  scheduledFor: string;
  content: string;
  [extra: string]: unknown;
}

interface PostTranslation {
  translatedText: string;
  sourceLanguage?: string | null;
  sourceLanguageConfidence?: number | null;
  targetLocale?: string | null;
  sameLanguage?: boolean;
}

interface PostDraft {
  id: number;
  content?: string;
  mediaUrls?: string[];
  poll?: Poll | null;
  scheduledFor?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [extra: string]: unknown;
}

interface PostAnalytics {
  viewsCount: number;
  likesCount: number;
  rekarotsCount: number;
  repliesCount: number;
  bookmarksCount?: number;
  reactionsCount?: number;
  audience?: {
    gender?: Record<string, number>;
    age?: Record<string, number>;
  };
  knownViewerCount?: number;
  anonymousViews?: number;
  [extra: string]: unknown;
}

interface BookmarkFolder {
  id: number;
  name: string;
  createdAt: string;
  postsCount?: number;
  [extra: string]: unknown;
}

interface ConversationInfo {
  rootPostId: number;
  isParticipant: boolean;
  hasLeftConversation: boolean;
  participants: User[];
}

interface ReplyTargets {
  rootPostId: number;
  selectedUserIds: number[];
  excludedUserIds: number[];
  candidates: User[];
}
```

## Authentication・Session・API key

```ts
interface LoginResult {
  message?: string;
  accessToken: string;
  refreshToken?: string;
  sessionId?: string;
  deviceId?: string;
  user: CurrentUser;
}

interface TwoFactorChallenge {
  twoFactorRequired: true;
  twoFactorToken: string;
}

interface TwoFactorSetup {
  secret?: string;
  qrCode?: string;
  otpauthUrl?: string;
  [extra: string]: unknown;
}

interface TwoFactorEnableResult {
  backupCodes: string[];
  message?: string;
}

interface CsrfToken {
  csrfToken: string;
}

interface SessionInfo {
  id: string;
  deviceId: string;
  clientType: string;
  deviceName: string;
  userAgent: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

interface SessionUnreadSnapshot {
  sessionId?: string;
  userId?: number;
  notificationsCount?: number;
  dmCount?: number;
  unreadCount?: number;
  capturedAt?: string;
  [extra: string]: unknown;
}

interface SwitchSessionResult {
  accessToken: string;
  refreshToken?: string;
  sessionId: string;
  user: CurrentUser;
}

interface ApiKey {
  id: number;
  name: string;
  prefix: string;
  canReadPosts?: boolean;
  canCreatePosts?: boolean;
  canReadTimeline?: boolean;
  canReadFollows?: boolean;
  canWriteFollows?: boolean;
  requestsPerMinute?: number;
  createdAt: string;
  [extra: string]: unknown;
}
```

### Legal quiz

```ts
interface LegalQuizOption {
  id: string;
  label?: string;
  explanation?: string;
  [extra: string]: unknown;
}

interface LegalQuizQuestion {
  id: string;
  options: LegalQuizOption[];
  [extra: string]: unknown;
}

interface LegalQuiz {
  token: string;
  questions: LegalQuizQuestion[];
  [extra: string]: unknown;
}

interface LegalQuizGradeResult {
  passed?: boolean;
  questions?: LegalQuizQuestion[];
  [extra: string]: unknown;
}
```

## DM

```ts
interface DmGroup {
  id: number;
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
  updatedAt?: string;
  [extra: string]: unknown;
}

interface ActiveCall {
  id: string;
  startedAt: string;
  participants?: number[];
}

interface DmMessage {
  id: number;
  groupId: number;
  senderId: number;
  content: string;
  replyToId?: number | null;
  attachmentUrls: string[];
  attachmentTypes: string[];
  attachmentAlts: string[];
  attachmentSpoilerFlags: boolean[];
  attachmentR18Flags: boolean[];
  isDeleted?: boolean;
  createdAt: string;
  editedAt?: string | null;
  sender?: User;
  reactions?: Array<{ emoji: string; userId: number }>;
  poll?: Poll | null;
  [extra: string]: unknown;
}

interface DmFile {
  id?: number | string;
  groupId?: number;
  messageId?: number;
  url: string;
  name?: string;
  type?: string;
  size?: number;
  uploadedAt?: string;
  [extra: string]: unknown;
}

interface DmGroupSettings {
  notificationsEnabled?: boolean;
  readReceiptsEnabled?: boolean;
  callPermission?: string;
  [extra: string]: unknown;
}
```

## Notification

```ts
type NotificationType =
  | "REPLY"
  | "MENTION"
  | "FOLLOW"
  | "FOLLOW_REQUEST"
  | "LIKE"
  | "REKAROT"
  | "QUOTE"
  | "REACTION"
  | "DM"
  | string;

interface Notification {
  id: string;
  type: NotificationType;
  actor?: User;
  actors?: User[];
  post?: Post;
  posts?: Post[];
  createdAt: string;
  readAt?: string | null;
  [extra: string]: unknown;
}
```

## Social・Search

```ts
interface Circle {
  id: number;
  name: string;
  ownerId: number;
  membersCount?: number;
  createdAt: string;
  members?: User[];
  [extra: string]: unknown;
}

interface SocialList {
  id: number;
  name: string;
  description?: string | null;
  ownerId: number;
  isPublic?: boolean;
  membersCount?: number;
  postsCount?: number;
  createdAt: string;
  members?: User[];
  [extra: string]: unknown;
}

interface Story {
  id: number;
  authorId: number;
  caption?: string | null;
  mediaUrl: string;
  mediaType: "image" | "video" | string;
  textOverlay?: string | null;
  textOverlayStyle?: JsonObject | null;
  visibility?: Visibility;
  viewerCircleId?: number | null;
  minimumAge?: number | null;
  maximumAge?: number | null;
  isR18?: boolean;
  hideFromMinors?: boolean;
  expiresAt: string;
  createdAt: string;
  author?: User;
  viewersCount?: number;
  likesCount?: number;
  liked?: boolean;
  hasViewed?: boolean;
  [extra: string]: unknown;
}

interface StoryComment {
  id: number;
  storyId: number;
  authorId: number;
  content: string;
  createdAt: string;
  author?: User;
}

interface StoryViewer {
  userId: number;
  viewedAt?: string;
  user?: User;
  [extra: string]: unknown;
}

interface AnonymousQuestion {
  id: number;
  recipientId: number;
  content: string;
  createdAt: string;
  answeredAt?: string | null;
  answer?: Post | null;
  [extra: string]: unknown;
}

interface LinkPreview {
  url: string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  siteName?: string | null;
  [extra: string]: unknown;
}

interface Hashtag {
  id: number;
  name: string;
  usageCount: number;
  trendScore: number;
  createdAt?: string;
  updatedAt?: string;
}

interface TrendingTopic {
  token: string;
  label: string;
  type: string;
  postCount: number;
  authorCount: number;
  trendScore: number;
}
```

## Community

```ts
interface Community {
  id: number;
  name: string;
  description?: string;
  joinType?: string;
  memberCount?: number;
  effectiveMinimumAge?: number | null;
  [extra: string]: unknown;
}

interface CommunityMember {
  user?: User;
  userId?: number;
  role?: string;
  [extra: string]: unknown;
}

interface CommunityReport {
  id: number;
  status?: string;
  [extra: string]: unknown;
}

interface CommunityTimeline {
  community: Community;
  position?: number;
  [extra: string]: unknown;
}
```

## Guild・Channel・Bot

```ts
interface Guild {
  id: number;
  name: string;
  [extra: string]: unknown;
}

interface GuildChannel {
  id: number;
  guildId?: number;
  name?: string;
  type?: string;
  [extra: string]: unknown;
}

interface GuildMember {
  user?: User;
  userId?: number;
  nick?: string | null;
  roles?: number[];
  [extra: string]: unknown;
}

interface GuildRole {
  id: number;
  name: string;
  [extra: string]: unknown;
}

interface GuildInvite {
  code: string;
  guild?: Guild;
  expiresAt?: string | null;
  [extra: string]: unknown;
}

interface GuildEvent {
  id: number;
  name?: string;
  startsAt?: string;
  [extra: string]: unknown;
}

interface GuildBan {
  user?: User;
  userId?: number;
  reason?: string | null;
  [extra: string]: unknown;
}

interface GuildMessage {
  id: number;
  channelId?: number;
  authorId?: number;
  author?: User;
  content?: string;
  reactions?: ReactionEntry[];
  [extra: string]: unknown;
}

interface GuildForumPost {
  id: number;
  channelId?: number;
  authorId?: number;
  author?: User;
  title?: string;
  content?: string;
  reactions?: ReactionEntry[];
  [extra: string]: unknown;
}

interface GuildStage {
  channelId?: number;
  [extra: string]: unknown;
}

interface GuildVoiceState {
  userId?: number;
  channelId?: number;
  [extra: string]: unknown;
}

interface GuildBotApplication {
  id: number;
  name: string;
  [extra: string]: unknown;
}

interface GuildApplicationCommand {
  id: number;
  name: string;
  description: string;
  guildId?: number | null;
  defaultMemberPermissions?: string | null;
  [extra: string]: unknown;
}

interface GuildCommandPermission {
  id: number;
  type: "ROLE" | "USER" | "CHANNEL";
  permission: boolean;
}
```

## Radio

```ts
type RadioRole = "HOST" | "SPEAKER" | "LISTENER" | string;

interface RadioParticipant {
  userId: number;
  role: RadioRole;
  muted?: boolean;
  joinedAt: string;
  user?: User;
}

interface RadioSpace {
  id: number;
  hostId: number;
  title: string;
  description?: string | null;
  isLive: boolean;
  isRecording?: boolean;
  participantsCount?: number;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt: string;
  host?: User;
  participants?: RadioParticipant[];
  settings?: RadioSettings;
  [extra: string]: unknown;
}

interface RadioSettings {
  recordingEnabled?: boolean;
  reactionsEnabled?: boolean;
  chatEnabled?: boolean;
  speakerApprovalRequired?: boolean;
  maxSpeakers?: number;
  [extra: string]: unknown;
}

interface RadioMessage {
  id: number;
  spaceId: number;
  senderId: number;
  content: string;
  createdAt: string;
  sender?: User;
}

interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}
```

## Draw

```ts
interface DrawRoom {
  id: string;
  name: string;
  ownerId: number;
  ownerUsername?: string;
  isPrivate: boolean;
  visibility?: string;
  capacity: number;
  inviteCode?: string | null;
  participantCount?: number;
  participantsCount?: number;
  createdAt: string;
  updatedAt?: string;
  owner?: User;
  participants?: DrawParticipant[];
  layers?: DrawLayer[];
  [extra: string]: unknown;
}

interface DrawParticipant {
  userId: number;
  role?: string;
  joinedAt: string;
  user?: User;
}

interface DrawLayer {
  id: string;
  name?: string;
  visible?: boolean;
  locked?: boolean;
  opacity?: number;
  dataUrl?: string;
  strokes?: DrawStroke[];
  [extra: string]: unknown;
}

interface DrawStroke {
  id?: string;
  userId?: number;
  username?: string;
  clientId?: string;
  layerId?: string;
  color?: string;
  secondaryColor?: string;
  size?: number;
  opacity?: number;
  points: DrawStrokePoint[];
  createdAt?: string;
  [extra: string]: unknown;
}

interface DrawStrokePoint {
  x: number;
  y: number;
  pressure?: number;
}
```

## News

```ts
type NewsStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PUBLISHED"
  | "REJECTED"
  | string;

interface NewsArticle {
  id: number;
  slug: string;
  title: string;
  body: string;
  status: NewsStatus;
  authorId: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author?: User;
  likesCount?: number;
  commentsCount?: number;
  liked?: boolean;
  coverImageUrl?: string | null;
  [extra: string]: unknown;
}

interface NewsComment {
  id: number;
  articleId: number;
  authorId: number;
  content: string;
  createdAt: string;
  updatedAt?: string | null;
  author?: User;
}
```

## Boards

```ts
interface Board {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  followersCount?: number;
  threadsCount?: number;
  createdAt: string;
  followed?: boolean;
  [extra: string]: unknown;
}

interface BoardThread {
  id: number;
  boardSlug: string;
  authorId: number;
  title: string;
  content: string;
  imageUrls?: string[];
  repliesCount?: number;
  reactionsCount?: number;
  createdAt: string;
  updatedAt?: string;
  author?: User;
  followed?: boolean;
  reactionSummary?: ReactionSummary[];
  [extra: string]: unknown;
}

interface BoardReply {
  id: number;
  threadId: number;
  authorId: number;
  content: string;
  imageUrls?: string[];
  createdAt: string;
  author?: User;
  reactionSummary?: ReactionSummary[];
}
```

## Subscription・OAuth

```ts
type SubscriptionPlanCode = "FREE" | "PLUS" | "PRO" | string;
type SubscriptionProductCode =
  | "PLUS"
  | "PRO"
  | "BADGE_RED"
  | "BADGE_GREEN"
  | string;

interface SubscriptionPlan {
  id?: number | string;
  code: SubscriptionProductCode;
  name: string;
  type?: "plan" | "badge" | string;
  amount: number;
  currency: string;
  interval: "month" | string;
}

interface SubscriptionSummary {
  plan: SubscriptionPlanCode;
  status: SubscriptionStatus;
  activeUntil?: string | null;
  cancelAtPeriodEnd?: boolean;
  scheduledPlan?: SubscriptionPlanCode | null;
  scheduledPlanEffectiveAt?: string | null;
  premiumBadgeColor?: PremiumBadgeColor;
  showProfileDecoration?: boolean;
  showCardDecoration?: boolean;
  profileAccentColor?: string | null;
  cardAccentColor?: string | null;
}

interface SubscriptionEntitlements {
  postTextLimit: number;
  pinnedPostLimit: number;
  uploadLimitBytes: number | null;
  canCustomizeProfile: boolean;
  canCustomizeCards: boolean;
  replyRankingBoost?: "NONE" | "PLUS" | "PRO";
  canUseProReactions?: boolean;
}

interface SubscriptionOverview {
  summary: SubscriptionSummary;
  entitlements?: SubscriptionEntitlements;
  plans?: SubscriptionPlan[];
  badges?: SubscriptionPlan[];
  subscriptions?: SubscriptionRecord[];
}

interface SubscriptionGift {
  id: number | string;
  purchaser: User;
  recipient?: User;
  productCode: SubscriptionProductCode;
  status?: SubscriptionGiftStatus;
  paidAt?: string | null;
}

interface CheckoutSession {
  url?: string;
  sessionId?: string;
  upgraded?: boolean;
  downgradeScheduled?: boolean;
}


interface OAuthClient {
  id: number | string;
  name: string;
  redirectUris?: string[];
  [extra: string]: unknown;
}

interface OAuthTokenResult {
  access_token: string;
  token_type: "Bearer" | string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

interface OAuthUserInfo {
  sub: string;
  id: number;
  username: string;
  displayName: string;
  picture?: string | null;
  email?: string;
  email_verified?: boolean;
}
```

## Admin diagnostics

```ts
interface AlgorithmStats {
  likes: number;
  rekarots: number;
  replies: number;
  views: number;
}

interface RecommendScoreBreakdown {
  engagement: number;
  freshness: number;
  authorAffinity: number;
  graph: number;
  socialProof: number;
  tagAffinity: number;
  inNetwork: number;
  totalRecommend: number;
}

interface RecommendRawCandidate {
  rank: number;
  author: User;
  score: number;
  trending: boolean;
}

interface RecommendRankedCandidate {
  rank: number;
  author: User;
  content: string;
  stats: AlgorithmStats;
  ageHours: number;
  scores: RecommendScoreBreakdown;
}

interface TrendingScoreBreakdown {
  velocity: number;
  uniqueActors: number;
  engagementRate: number;
  freshness: number;
  total: number;
}

interface TrendingWindowStats {
  likes1h: number;
  likes6h: number;
  likes24h: number;
  rekarots1h: number;
  rekarots6h: number;
  rekarots24h: number;
  replies1h: number;
  replies6h: number;
  replies24h: number;
  uniqueActors: number;
}

interface TrendingRawCandidate {
  rank: number;
  author: User;
  total: number;
  velocity: number;
  uniqueActors: number;
}

interface TrendingRankedCandidate {
  rank: number;
  author: User;
  content: string;
  stats: AlgorithmStats;
  ageHours: number;
  trendBreakdown: TrendingScoreBreakdown;
  windowStats: TrendingWindowStats;
}
```

## Response envelope index

| Envelope | Field |
|---|---|
| `PostListResponse` | `posts: Post[]`, `pagination?: PageInfo` |
| `UserListResponse` | `users: User[]`, `pagination?: PageInfo` |
| `DmGroupsResponse` | `groups: DmGroup[]`, `pagination?: PageInfo` |
| `DmMessagesResponse` | `messages: DmMessage[]`, `pagination?: PageInfo` |
| `NotificationListResponse` | `notifications: Notification[]`, `pagination?: PageInfo` |
| `CommunityListResponse` | `communities: Community[]`, `pagination?: PageInfo` |
| `CommunityPostsResponse` | `posts: Post[]`, `pagination?: PageInfo` |
| `GuildListResponse` | `guilds: Guild[]`, `pagination?: PageInfo` |
| `NewsListResponse` | `articles: NewsArticle[]`, `pagination?: PageInfo` |
| `NewsCommentsResponse` | `comments: NewsComment[]`, `pagination?: PageInfo` |
| `BoardsResponse` | `boards: Board[]`, `pagination?: PageInfo` |

一覧 endpoint は envelope 名が似ていても主要配列 key が異なる。HTTP status だけで成功扱いせず、期待する配列 key を検証する。
