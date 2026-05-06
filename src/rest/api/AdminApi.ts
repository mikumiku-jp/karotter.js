import type { RestClient } from "../RestClient.js";
import type { Post } from "../../structures/Post.js";
import type { User } from "../../structures/User.js";
import type {
  JsonArray,
  JsonObject,
  JsonValue,
  MessageEnvelope,
  PageInfo,
  Snowflake,
} from "../../util/types.js";
import { encodeId, encodeQuery } from "../utils.js";

export const ADMIN_DEFAULT_PREFIX = "/control-room-x9k2";

export interface AdminApiOptions {
  prefix?: string;
}

export interface AdminListQuery {
  search?: string;
  status?: string;
  minId?: string;
  maxId?: string;
  limit?: number;
  cursor?: string;
}

export interface AdminUser extends User {
  email?: string;
  isBanned?: boolean;
  bannedUntil?: string | null;
  banReason?: string | null;
  reportCount?: number;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  pagination?: PageInfo;
}

export interface AdminPostListResponse {
  posts: Post[];
  pagination?: PageInfo;
}

export interface AdminUserFlags {
  isBotAccount?: boolean;
  isParodyAccount?: boolean;
  hideProfileFromMinors?: boolean;
  adminForceBot?: boolean;
  adminForceParody?: boolean;
}

export interface AdminPostFlags {
  isR18?: boolean;
  hideFromMinors?: boolean;
  adminForceHidden?: boolean;
  adminForceR18?: boolean;
}

export interface AdminBanInput {
  reason?: string;
  bannedUntil?: string | Date;
}

export type AdminJsonResponse = JsonObject | JsonArray;
export type AdminMutationBody = Record<string, JsonValue | undefined>;

export type RecommendVariant = "A" | "B" | "C" | "D" | "E";

export interface AlgorithmStats {
  likes: number;
  rekarots: number;
  replies: number;
  views: number;
}

export interface RecommendSignalsSummary {
  authorAffinityCount: number;
  socialProofCount: number;
  mutualFollowCount: number;
  tagAffinityTop10: Array<{ tag: string; score: number }>;
}

export interface RecommendScoreBreakdown {
  engagement: number;
  freshness: number;
  authorAffinity: number;
  graph: number;
  socialProof: number;
  tagAffinity: number;
  inNetwork: number;
  totalRecommend: number;
}

export interface RecommendRawCandidate {
  rank: number;
  author: User;
  score: number;
  trending: boolean;
}

export interface RecommendRankedCandidate {
  rank: number;
  author: User;
  content: string;
  stats: AlgorithmStats;
  ageHours: number;
  scores: RecommendScoreBreakdown;
}

export interface TestRecommendResponse {
  targetUser: {
    id: Snowflake;
    username: string;
    displayName: string;
  };
  variant?: RecommendVariant;
  followingCount: number;
  candidateCount: number;
  signalsSummary: RecommendSignalsSummary;
  rawTopByScore: RecommendRawCandidate[];
  ranked: RecommendRankedCandidate[];
}

export interface TrendingScoreBreakdown {
  velocity: number;
  uniqueActors: number;
  engagementRate: number;
  freshness: number;
  total: number;
}

export interface TrendingWindowStats {
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

export interface TrendingRawCandidate {
  rank: number;
  author: User;
  total: number;
  velocity: number;
  uniqueActors: number;
}

export interface TrendingRankedCandidate {
  rank: number;
  author: User;
  content: string;
  stats: AlgorithmStats;
  ageHours: number;
  trendBreakdown: TrendingScoreBreakdown;
  windowStats: TrendingWindowStats;
}

export interface TestTrendingResponse {
  candidateCount: number;
  rawTop10: TrendingRawCandidate[];
  ranked: TrendingRankedCandidate[];
}

export interface SurveyResultsResponse {
  totalResponses: number;
  satisfactionScore?: number;
  responses?: Array<{
    userId: Snowflake;
    rating: number;
    comment?: string;
    submittedAt: string;
  }>;
  [extra: string]: unknown;
}

export class AdminApi {
  readonly prefix: string;

  constructor(
    private readonly rest: RestClient,
    options: AdminApiOptions = {},
  ) {
    this.prefix = options.prefix ?? ADMIN_DEFAULT_PREFIX;
  }

  private url(rest: string): string {
    return `${this.prefix}${rest.startsWith("/") ? rest : `/${rest}`}`;
  }

  dashboard(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/dashboard"));
  }

  overview(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/overview"));
  }

  analytics(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/analytics"));
  }

  stats(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/stats"));
  }

  users(query?: AdminListQuery): Promise<AdminUserListResponse> {
    return this.rest.get(this.url("/users"), encodeQuery(query));
  }

  fetchUser(userId: Snowflake | string): Promise<{ user: AdminUser }> {
    return this.rest.get(this.url(`/users/${encodeId(userId)}`));
  }

  searchUsers(query: AdminListQuery): Promise<AdminUserListResponse> {
    return this.rest.get(this.url("/users/search"), encodeQuery(query));
  }

  banUser(
    userId: Snowflake | string,
    input: AdminBanInput = {},
  ): Promise<MessageEnvelope> {
    const body: AdminMutationBody = {};
    if (input.reason) body["reason"] = input.reason;
    if (input.bannedUntil)
      body["bannedUntil"] =
        input.bannedUntil instanceof Date
          ? input.bannedUntil.toISOString()
          : input.bannedUntil;
    return this.rest.patch(this.url(`/users/${encodeId(userId)}/ban`), body);
  }

  unbanUser(userId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.patch(this.url(`/users/${encodeId(userId)}/unban`));
  }

  verifyUser(
    userId: Snowflake | string,
    body: AdminMutationBody = {},
  ): Promise<MessageEnvelope> {
    return this.rest.patch(this.url(`/users/${encodeId(userId)}/verify`), body);
  }

  setUserFlags(
    userId: Snowflake | string,
    flags: AdminUserFlags,
  ): Promise<MessageEnvelope> {
    return this.rest.patch(this.url(`/users/${encodeId(userId)}/flags`), flags);
  }

  updateUserAccount(
    userId: Snowflake | string,
    body: AdminMutationBody,
  ): Promise<MessageEnvelope> {
    return this.rest.patch(
      this.url(`/users/${encodeId(userId)}/account`),
      body,
    );
  }

  setUserOfficialMark(
    userId: Snowflake | string,
    mark: string | string[] | null,
  ): Promise<MessageEnvelope> {
    return this.rest.patch(
      this.url(`/users/${encodeId(userId)}/official-mark`),
      { officialMark: mark },
    );
  }

  setUserEmail(
    userId: Snowflake | string,
    email: string,
  ): Promise<MessageEnvelope> {
    return this.rest.patch(this.url(`/users/${encodeId(userId)}/email`), {
      email,
    });
  }

  setUserPassword(
    userId: Snowflake | string,
    password: string,
  ): Promise<MessageEnvelope> {
    return this.rest.patch(this.url(`/users/${encodeId(userId)}/password`), {
      password,
    });
  }

  setUserRole(
    userId: Snowflake | string,
    role: string,
  ): Promise<MessageEnvelope> {
    return this.rest.patch(this.url(`/users/${encodeId(userId)}/role`), {
      role,
    });
  }

  userSessions(userId: Snowflake | string): Promise<AdminJsonResponse> {
    return this.rest.get(this.url(`/users/${encodeId(userId)}/sessions`));
  }

  userPosts(userId: Snowflake | string): Promise<AdminPostListResponse> {
    return this.rest.get(this.url(`/users/${encodeId(userId)}/posts`));
  }

  userReports(userId: Snowflake | string): Promise<AdminJsonResponse> {
    return this.rest.get(this.url(`/users/${encodeId(userId)}/reports`));
  }

  userBans(userId: Snowflake | string): Promise<AdminJsonResponse> {
    return this.rest.get(this.url(`/users/${encodeId(userId)}/bans`));
  }

  userNotes(userId: Snowflake | string): Promise<AdminJsonResponse> {
    return this.rest.get(this.url(`/users/${encodeId(userId)}/notes`));
  }

  userHistory(userId: Snowflake | string): Promise<AdminJsonResponse> {
    return this.rest.get(this.url(`/users/${encodeId(userId)}/history`));
  }

  warnUser(
    userId: Snowflake | string,
    body: { reason?: string; message?: string } = {},
  ): Promise<MessageEnvelope> {
    return this.rest.post(this.url(`/users/${encodeId(userId)}/warn`), body);
  }

  deleteUser(userId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(this.url(`/users/${encodeId(userId)}`));
  }

  posts(query?: AdminListQuery): Promise<AdminPostListResponse> {
    return this.rest.get(this.url("/posts"), encodeQuery(query));
  }

  fetchPost(postId: Snowflake | string): Promise<{ post: Post }> {
    return this.rest.get(this.url(`/posts/${encodeId(postId)}`));
  }

  searchPosts(query: AdminListQuery): Promise<AdminPostListResponse> {
    return this.rest.get(this.url("/posts/search"), encodeQuery(query));
  }

  setPostFlags(
    postId: Snowflake | string,
    flags: AdminPostFlags,
  ): Promise<MessageEnvelope> {
    return this.rest.patch(this.url(`/posts/${encodeId(postId)}/flags`), flags);
  }

  hidePost(
    postId: Snowflake | string,
    body: { hidden?: boolean } = {},
  ): Promise<MessageEnvelope> {
    return this.rest.patch(this.url(`/posts/${encodeId(postId)}/hide`), body);
  }

  deletePost(postId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(this.url(`/posts/${encodeId(postId)}`));
  }

  stories(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/stories"), encodeQuery(query));
  }

  setStoryFlags(
    storyId: Snowflake | string,
    flags: AdminPostFlags,
  ): Promise<MessageEnvelope> {
    return this.rest.patch(this.url(`/stories/${encodeId(storyId)}/flags`), flags);
  }

  deleteStory(storyId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(this.url(`/stories/${encodeId(storyId)}`));
  }

  reports(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/reports"), encodeQuery(query));
  }

  pendingReports(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/reports/pending"));
  }

  resolvedReports(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/reports/resolved"));
  }

  fetchReport(reportId: Snowflake | string): Promise<AdminJsonResponse> {
    return this.rest.get(this.url(`/reports/${encodeId(reportId)}`));
  }

  resolveReport(
    reportId: Snowflake | string,
    body: { note?: string } = {},
  ): Promise<MessageEnvelope> {
    return this.rest.post(
      this.url(`/reports/${encodeId(reportId)}/resolve`),
      body,
    );
  }

  dismissReport(reportId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(this.url(`/reports/${encodeId(reportId)}/dismiss`));
  }

  escalateReport(reportId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(this.url(`/reports/${encodeId(reportId)}/escalate`));
  }

  newsList(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/news"), encodeQuery(query));
  }

  newsComments(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/news/comments"), encodeQuery(query));
  }

  reviewNews(
    articleId: Snowflake | string,
    decision: { action: "approve" | "reject" | "unpublish"; reviewNote?: string },
  ): Promise<MessageEnvelope> {
    return this.rest.patch(
      this.url(`/news/${encodeId(articleId)}/review`),
      decision,
    );
  }

  deleteNewsArticle(articleId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(this.url(`/news/${encodeId(articleId)}`));
  }

  deleteNewsComment(commentId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(
      this.url(`/news/comments/${encodeId(commentId)}`),
    );
  }

  bots(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/bot-requests"));
  }

  verificationRequests(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/verification-requests"));
  }

  appeals(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/appeals"));
  }

  bans(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/bans"));
  }

  ipBans(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/ip-bans"));
  }

  shadowbans(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/shadowbans"));
  }

  announcements(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/announcements"));
  }

  createAnnouncement(body: AdminMutationBody): Promise<AdminJsonResponse> {
    return this.rest.post(this.url("/announcements/create"), body);
  }

  badges(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/badges"));
  }

  emoji(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/emoji"));
  }

  frames(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/frames"));
  }

  themes(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/themes"));
  }

  stickers(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/stickers"));
  }

  featureFlags(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/feature-flags"));
  }

  settings(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/settings"));
  }

  setSetting(body: AdminMutationBody): Promise<MessageEnvelope> {
    return this.rest.post(this.url("/settings"), body);
  }

  config(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/config"));
  }

  auditLog(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/audit-log"));
  }

  logs(type?: string): Promise<AdminJsonResponse> {
    return this.rest.get(this.url(type ? `/logs/${encodeId(type)}` : "/logs"));
  }

  maintenance(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/maintenance"));
  }

  enableMaintenance(body: AdminMutationBody = {}): Promise<MessageEnvelope> {
    return this.rest.post(this.url("/maintenance"), body);
  }

  cron(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/cron"));
  }

  queue(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/queue"));
  }

  cache(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/cache"));
  }

  clearCache(): Promise<MessageEnvelope> {
    return this.rest.post(this.url("/cache/clear"));
  }

  apiKeys(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/api-keys"));
  }

  webhooks(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/webhooks"));
  }

  blockedWords(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/blocked-words"));
  }

  betaExperiment(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/beta-experiment"));
  }

  testRecommend(
    query: { limit?: number; userId?: Snowflake | string } = {},
  ): Promise<TestRecommendResponse> {
    return this.rest.get(
      this.url("/test-recommend"),
      encodeQuery(query),
    );
  }

  testTrending(
    query: { limit?: number } = {},
  ): Promise<TestTrendingResponse> {
    return this.rest.get(
      this.url("/test-trending"),
      encodeQuery(query),
    );
  }

  surveyResults(
    query: { limit?: number } = {},
  ): Promise<SurveyResultsResponse> {
    return this.rest.get(
      this.url("/survey-results"),
      encodeQuery(query),
    );
  }

  index(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url(""));
  }

  actions(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/actions"), encodeQuery(query));
  }

  audit(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/audit"), encodeQuery(query));
  }

  backup(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/backup"));
  }

  triggerBackup(body: AdminMutationBody = {}): Promise<MessageEnvelope> {
    return this.rest.post(this.url("/backup"), body);
  }

  database(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/database"));
  }

  dm(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/dm"), encodeQuery(query));
  }

  draw(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/draw"), encodeQuery(query));
  }

  emails(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/emails"), encodeQuery(query));
  }

  feedback(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/feedback"), encodeQuery(query));
  }

  features(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/features"));
  }

  filteredWords(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/filtered-words"));
  }

  flaggedContent(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/flagged-content"), encodeQuery(query));
  }

  gacha(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/gacha"));
  }

  gachaItems(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/gacha/items"));
  }

  fetchGacha(gachaId: Snowflake | string): Promise<AdminJsonResponse> {
    return this.rest.get(this.url(`/gacha/${encodeId(gachaId)}`));
  }

  invites(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/invites"), encodeQuery(query));
  }

  jobs(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/jobs"), encodeQuery(query));
  }

  media(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/media"), encodeQuery(query));
  }

  migrations(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/migrations"));
  }

  moderation(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/moderation"));
  }

  moderationAutomod(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/moderation/automod"));
  }

  moderationFilters(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/moderation/filters"));
  }

  moderationQueue(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/moderation/queue"), encodeQuery(query));
  }

  moderationRules(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/moderation/rules"));
  }

  moderationWords(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/moderation/words"));
  }

  monetization(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/monetization"));
  }

  notifications(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/notifications"), encodeQuery(query));
  }

  payments(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/payments"), encodeQuery(query));
  }

  permissions(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/permissions"));
  }

  premium(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/premium"));
  }

  radio(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/radio"), encodeQuery(query));
  }

  rateLimits(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/rate-limits"));
  }

  roles(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/roles"));
  }

  search(query: AdminListQuery & { q?: string }): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/search"), encodeQuery(query));
  }

  searchIndex(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/search/index"));
  }

  sessions(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/sessions"), encodeQuery(query));
  }

  statsDaily(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/stats/daily"));
  }

  statsPosts(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/stats/posts"));
  }

  statsUsers(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/stats/users"));
  }

  subscriptions(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/subscriptions"), encodeQuery(query));
  }

  system(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/system"));
  }

  tasks(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/tasks"), encodeQuery(query));
  }

  trending(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/trending"));
  }

  trendingOverride(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/trending/override"));
  }

  uploads(query?: AdminListQuery): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/uploads"), encodeQuery(query));
  }

  fetchAnnouncement(announcementId: Snowflake | string): Promise<AdminJsonResponse> {
    return this.rest.get(this.url(`/announcements/${encodeId(announcementId)}`));
  }

  fetchBadge(badgeId: Snowflake | string): Promise<AdminJsonResponse> {
    return this.rest.get(this.url(`/badges/${encodeId(badgeId)}`));
  }

  createBadge(body: AdminMutationBody): Promise<AdminJsonResponse> {
    return this.rest.post(this.url("/badges/create"), body);
  }

  fetchBan(banId: Snowflake | string): Promise<AdminJsonResponse> {
    return this.rest.get(this.url(`/bans/${encodeId(banId)}`));
  }

  createBan(body: AdminMutationBody): Promise<AdminJsonResponse> {
    return this.rest.post(this.url("/bans/create"), body);
  }

  fetchEmoji(emojiId: Snowflake | string): Promise<AdminJsonResponse> {
    return this.rest.get(this.url(`/emoji/${encodeId(emojiId)}`));
  }

  createEmoji(body: AdminMutationBody): Promise<AdminJsonResponse> {
    return this.rest.post(this.url("/emoji/create"), body);
  }

  fetchFrame(frameId: Snowflake | string): Promise<AdminJsonResponse> {
    return this.rest.get(this.url(`/frames/${encodeId(frameId)}`));
  }

  fetchIpBan(banId: Snowflake | string): Promise<AdminJsonResponse> {
    return this.rest.get(this.url(`/ip-bans/${encodeId(banId)}`));
  }

  fetchSticker(stickerId: Snowflake | string): Promise<AdminJsonResponse> {
    return this.rest.get(this.url(`/stickers/${encodeId(stickerId)}`));
  }

  fetchTheme(themeId: Snowflake | string): Promise<AdminJsonResponse> {
    return this.rest.get(this.url(`/themes/${encodeId(themeId)}`));
  }

  userRestrict(userId: Snowflake | string): Promise<AdminJsonResponse> {
    return this.rest.get(this.url(`/users/${encodeId(userId)}/restrict`));
  }

  userSuspend(userId: Snowflake | string): Promise<AdminJsonResponse> {
    return this.rest.get(this.url(`/users/${encodeId(userId)}/suspend`));
  }

  createUser(body: AdminMutationBody): Promise<AdminJsonResponse> {
    return this.rest.post(this.url("/users"), body);
  }

  fetchLog(type: string): Promise<AdminJsonResponse> {
    return this.rest.get(this.url(`/logs/${encodeId(type)}`));
  }

  apikeys(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/apikeys"));
  }

  domains(): Promise<AdminJsonResponse> {
    return this.rest.get(this.url("/domains"));
  }
}
