import {
  RestClient,
  type RequestOptions,
  type RestClientOptions,
} from "./rest/RestClient.js";
import { AdminApi } from "./rest/api/AdminApi.js";
import { ApiKeysApi } from "./rest/api/ApiKeysApi.js";
import { AuthApi } from "./rest/api/AuthApi.js";
import { BoardsApi } from "./rest/api/BoardsApi.js";
import { DeveloperApi } from "./rest/api/DeveloperApi.js";
import { LegalApi } from "./rest/api/LegalApi.js";
import { MiscApi } from "./rest/api/MiscApi.js";
import { NewsApi } from "./rest/api/NewsApi.js";
import { Gateway, type GatewayOptions } from "./realtime/Gateway.js";
import type {
  ClientEventArgs,
  ClientEventName,
  ServerEventHandler,
  ServerEventName,
} from "./realtime/events.js";
import type {
  LoginInput,
  LoginResult,
  RegisterInput,
} from "./structures/Auth.js";
import type {
  CreatePostInput,
  MediaAttachment,
  PollDraft,
  Post,
  PostAnalytics,
} from "./structures/Post.js";
import type { CurrentUser, User, UserDetail } from "./structures/User.js";
import type {
  CursorPagination,
  JsonObject,
  MessageEnvelope,
  OffsetPagination,
  PageInfo,
  Pagination,
  ReplyRestriction,
  Snowflake,
  Visibility,
} from "./util/types.js";
import {
  appendField,
  appendJson,
  appendMedia,
  type MediaInput,
} from "./util/form.js";
import { encodeId, encodeQuery } from "./rest/utils.js";
import {
  assertAtLeast,
  assertAtMost,
  assertNonEmptyText,
  assertPositiveInteger,
  assertValidDate,
} from "./util/validation.js";
import { ValidationError } from "./util/errors.js";

export type VisibilityOption = Lowercase<Visibility> | Visibility;
export type ReplyRestrictionOption =
  | Lowercase<ReplyRestriction>
  | ReplyRestriction;

const DEFAULT_POST_VISIBILITY: Visibility = "PUBLIC";
const DEFAULT_REPLY_RESTRICTION: ReplyRestriction = "EVERYONE";
const DEFAULT_POLL_DURATION_HOURS = 24;
const DEFAULT_POLL_IS_ANONYMOUS = true;

export type ResourceTarget =
  | Snowflake
  | string
  | {
      id: Snowflake | string;
    };

export interface KarotterOptions extends RestClientOptions {
  gateway?: GatewayOptions;
  connect?: boolean;
}

export interface LoginOptions extends Omit<LoginInput, "identifier"> {
  id: string;
}

export interface TokenLoginOptions {
  accessToken: string;
  refreshToken?: string | null;
}

export interface PostOptions
  extends Omit<
    CreatePostInput,
    "content" | "visibility" | "replyRestriction"
  > {
  visibility?: VisibilityOption;
  replyRestriction?: ReplyRestrictionOption;
}

export interface MediaPostOptions extends Omit<PostOptions, "media" | "poll"> {
  media: MediaAttachment[];
}

export interface PollPostOptions extends Omit<PostOptions, "media" | "poll"> {
  poll: PollDraft;
}

export interface TimelineOptions extends OffsetPagination {
  mode?: "latest" | "trending" | "following";
}

export interface RecommendedOptions extends Pagination {
  mode?: "algorithm" | "latest" | "beta" | (string & {});
}

export interface BookmarkListOptions extends Pagination {
  folderId?: Snowflake | string;
}

export interface FetchOptions {
  includeMutedOrBlocked?: boolean;
}

export interface NotificationGroupedPostsOptions extends CursorPagination {
  notificationIds?: string[];
}

export interface NotificationReadAllOptions {
  types?: string[];
}

export interface CircleCreateOptions {
  name: string;
  memberIds?: ResourceTarget[];
}

export interface SocialListCreateOptions {
  name: string;
  description?: string;
  isPublic?: boolean;
  memberIds?: ResourceTarget[];
}

export interface QuestionSendOptions {
  targetUserId: ResourceTarget;
  content: string;
}

export interface NewsListOptions extends Pagination {
  category?: string;
}

export interface RadioCreateOptions {
  title: string;
  description?: string | null;
  mode?: "PUBLIC" | "FOLLOWERS_ONLY" | "INVITE_ONLY" | (string & {});
  speakerPermission?:
    | "FOLLOWING_ONLY"
    | "EVERYONE"
    | "INVITED_ONLY"
    | (string & {});
}

export interface PostList {
  posts: Post[];
  pagination?: PageInfo;
}

export interface UserList {
  users: User[];
  pagination?: PageInfo;
}

export interface QuoteList {
  quotes: Post[];
  pagination?: PageInfo;
}

export interface ReplyList {
  replies: Post[];
  pagination?: PageInfo;
}

export interface SearchOptions {
  q: string;
  page?: number;
  limit?: number;
  cursor?: Snowflake | string;
}

export interface PostSearchOptions extends SearchOptions {
  type?: "latest" | "media" | "topics";
}

export interface SearchResult {
  users: User[];
  posts: Post[];
  hashtags: unknown[];
  pagination?: PageInfo;
}

export interface DmGroup {
  id: Snowflake;
  [extra: string]: unknown;
}

export interface DmMessage {
  id: Snowflake;
  content?: string;
  [extra: string]: unknown;
}

export interface DmMessageOptions {
  replyToId?: Snowflake | string;
  attachments?: MediaAttachment[];
  poll?: PollDraft;
}

export interface RequestInput {
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  options?: RequestOptions;
}

export class Karotter {
  readonly auth: AuthActions;
  readonly posts: PostsActions;
  readonly timeline: TimelineActions;
  readonly users: UsersActions;
  readonly follows: FollowActions;
  readonly dm: DmActions;
  readonly notifications: NotificationsActions;
  readonly search: SearchActions;
  readonly social: SocialActions;
  readonly radio: RadioActions;
  readonly draw: DrawActions;
  readonly news: NewsActions;
  readonly boards: BoardsActions;
  readonly apiKeys: ApiKeyActions;
  readonly developer: DeveloperActions;
  readonly legal: LegalActions;
  readonly misc: MiscActions;
  readonly admin: AdminActions;

  user: CurrentUser | null = null;

  private readonly rest: RestClient;
  private readonly gateway: Gateway;
  private readonly authApi: AuthApi;
  private readonly shouldConnectAfterAuth: boolean;

  constructor(options: KarotterOptions = {}) {
    const { gateway, connect, ...restOptions } = options;
    this.rest = new RestClient(restOptions);
    this.gateway = new Gateway(this.rest, gateway);
    this.authApi = new AuthApi(this.rest);
    this.shouldConnectAfterAuth = connect ?? false;
    this.auth = new AuthActions(this.rest, this.authApi);
    this.posts = new PostsActions(this.rest);
    this.timeline = new TimelineActions(this.rest);
    this.users = new UsersActions(this.rest);
    this.follows = new FollowActions(this.rest);
    this.dm = new DmActions(this.rest);
    this.notifications = new NotificationsActions(this.rest);
    this.search = new SearchActions(this.rest);
    this.social = new SocialActions(this.rest);
    this.radio = new RadioActions(this.rest);
    this.draw = new DrawActions(this.rest);
    this.news = new NewsActions(this.rest);
    this.boards = new BoardsActions(this.rest);
    this.apiKeys = new ApiKeyActions(this.rest);
    this.developer = new DeveloperActions(this.rest);
    this.legal = new LegalActions(this.rest);
    this.misc = new MiscActions(this.rest);
    this.admin = new AdminActions(this.rest);
  }

  get id(): Snowflake | null {
    return this.user?.id ?? null;
  }

  get isLoggedIn(): boolean {
    return this.user !== null;
  }

  async login(input: LoginOptions): Promise<CurrentUser> {
    const loginInput: LoginInput = {
      identifier: input.id,
      password: input.password,
    };
    if (input.gender !== undefined) loginInput.gender = input.gender;
    const result = await this.authApi.login(loginInput);
    return this.applyLoginResult(result);
  }

  async register(input: RegisterInput): Promise<CurrentUser> {
    const result = await this.authApi.register(input);
    return this.applyLoginResult(result);
  }

  async useToken(input: TokenLoginOptions): Promise<CurrentUser> {
    this.rest.auth.setTokens({
      accessToken: input.accessToken,
      refreshToken: input.refreshToken ?? null,
    });
    return this.me();
  }

  async me(): Promise<CurrentUser> {
    const user = await this.rest.get<CurrentUser>("/auth/me");
    this.user = user;
    return user;
  }

  async logout(): Promise<MessageEnvelope> {
    const response = await this.authApi.logout();
    this.user = null;
    this.gateway.disconnect();
    return response;
  }

  post(content: string, options: PostOptions = {}): Promise<Post> {
    return this.posts.create(content, options);
  }

  media(
    content: string,
    media: MediaAttachment[],
    options: Omit<MediaPostOptions, "media"> = {},
  ): Promise<Post> {
    return this.posts.create(content, { ...options, media });
  }

  poll(
    content: string,
    poll: PollDraft,
    options: Omit<PollPostOptions, "poll"> = {},
  ): Promise<Post> {
    return this.posts.create(content, { ...options, poll });
  }

  reply(
    target: ResourceTarget,
    content: string,
    options: PostOptions = {},
  ): Promise<Post> {
    return this.posts.reply(target, content, options);
  }

  quote(
    target: ResourceTarget,
    content: string,
    options: PostOptions = {},
  ): Promise<Post> {
    return this.posts.quote(target, content, options);
  }

  delete(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.posts.delete(target);
  }

  like(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.posts.like(target);
  }

  unlike(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.posts.unlike(target);
  }

  repost(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.posts.repost(target);
  }

  unrepost(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.posts.unrepost(target);
  }

  bookmark(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.posts.bookmark(target);
  }

  unbookmark(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.posts.unbookmark(target);
  }

  connect(): void {
    this.gateway.connect();
  }

  disconnect(): void {
    this.gateway.disconnect();
  }

  on<T extends ServerEventName>(
    event: T,
    listener: ServerEventHandler<T>,
  ): this {
    this.gateway.on(event, listener);
    return this;
  }

  once<T extends ServerEventName>(
    event: T,
    listener: ServerEventHandler<T>,
  ): this {
    this.gateway.once(event, listener);
    return this;
  }

  off<T extends ServerEventName>(
    event: T,
    listener?: ServerEventHandler<T>,
  ): this {
    this.gateway.off(event, listener);
    return this;
  }

  emit<T extends ClientEventName>(
    event: T,
    ...args: ClientEventArgs<T>
  ): this {
    this.gateway.emit(event, ...args);
    return this;
  }

  request<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    input: RequestInput = {},
  ): Promise<T> {
    const options: RequestOptions = {
      ...(input.options ?? {}),
      ...(input.query ? encodeQuery(input.query) : {}),
      ...(input.headers ? { headers: input.headers } : {}),
    };
    if (method === "GET") return this.rest.get<T>(path, options);
    if (method === "POST") return this.rest.post<T>(path, input.body, options);
    if (method === "PUT") return this.rest.put<T>(path, input.body, options);
    if (method === "PATCH") return this.rest.patch<T>(path, input.body, options);
    return this.rest.delete<T>(path, { ...options, data: input.body });
  }

  async destroy(): Promise<void> {
    this.gateway.disconnect();
    if (this.rest.auth.isAuthenticated) {
      try {
        await this.authApi.logout();
      } catch {
        this.rest.auth.clearTokens();
      }
    }
    this.user = null;
  }

  private applyLoginResult(result: LoginResult): CurrentUser {
    this.user = result.user;
    if (this.shouldConnectAfterAuth) this.connect();
    return result.user;
  }
}

export class AuthActions {
  constructor(
    private readonly rest: RestClient,
    private readonly api: AuthApi,
  ) {}

  csrf(): Promise<{ csrfToken: string }> {
    return this.api.getCsrfToken();
  }

  invalidateCsrf(): Promise<MessageEnvelope | undefined> {
    return this.api.invalidateCsrfToken();
  }

  refresh(): Promise<{
    accessToken: string;
    refreshToken: string | null;
  }> {
    return this.api.refreshTokens();
  }

  sessions(): Promise<{ sessions: unknown[] }> {
    return this.rest.get("/auth/sessions");
  }

  revokeSession(sessionId: string): Promise<MessageEnvelope> {
    return this.rest.delete(`/auth/sessions/${encodeId(sessionId)}`);
  }

  revokeOtherSessions(): Promise<MessageEnvelope & { revokedCount?: number }> {
    return this.rest.delete("/auth/sessions/others");
  }

  revokeAllSessions(): Promise<MessageEnvelope> {
    return this.rest.delete("/auth/sessions/all");
  }

  switchSession(input: {
    sessionId?: string;
    userId?: Snowflake;
  }): Promise<{
    accessToken: string;
    refreshToken?: string;
    sessionId: string;
    user: CurrentUser;
  }> {
    return this.rest.post("/auth/switch-session", input);
  }

  unreadSnapshots(): Promise<{ snapshots: unknown[] }> {
    return this.rest.post("/auth/session-unread-snapshots", {
      deviceId: this.rest.auth.deviceId,
    });
  }

  forgotPassword(email: string): Promise<MessageEnvelope> {
    return this.rest.post("/auth/forgot-password", { email });
  }

  resetPassword(token: string, password: string): Promise<MessageEnvelope> {
    return this.rest.post("/auth/reset-password", { token, password });
  }

  verifyEmail(token: string): Promise<MessageEnvelope> {
    return this.rest.post("/auth/verify-email", { token });
  }

  setEmail(email: string): Promise<{
    message: string;
    email: string;
    cooldownSeconds?: number;
  }> {
    return this.rest.post("/auth/me/email", { email });
  }

  resendVerificationEmail(): Promise<MessageEnvelope> {
    return this.rest.post("/auth/me/email/resend");
  }

  resendVerificationByEmail(email: string): Promise<MessageEnvelope> {
    return this.rest.post("/auth/resend-verification", { email });
  }

  oauthUrl(options: {
    provider: "google" | "discord";
    mode: "login" | "register";
    frontendOrigin?: string;
    next?: string;
    addAccount?: boolean;
  }): string {
    return this.api.buildOAuthStartUrl(options);
  }
}

export class PostsActions {
  constructor(private readonly rest: RestClient) {}

  async create(content: string, options: PostOptions = {}): Promise<Post> {
    const response = await this.rest.post<{ post: Post }>(
      "/posts",
      buildPostForm({ ...toPostInput(options), content }, { requireBody: true }),
    );
    return response.post;
  }

  async media(
    content: string,
    media: MediaAttachment[],
    options: Omit<MediaPostOptions, "media"> = {},
  ): Promise<Post> {
    return this.create(content, { ...options, media });
  }

  async poll(
    content: string,
    poll: PollDraft,
    options: Omit<PollPostOptions, "poll"> = {},
  ): Promise<Post> {
    return this.create(content, { ...options, poll });
  }

  async reply(
    target: ResourceTarget,
    content: string,
    options: PostOptions = {},
  ): Promise<Post> {
    return this.create(content, { ...options, parentId: idOf(target) });
  }

  async quote(
    target: ResourceTarget,
    content: string,
    options: PostOptions = {},
  ): Promise<Post> {
    return this.create(content, { ...options, quotedPostId: idOf(target) });
  }

  get(target: ResourceTarget, query?: FetchOptions): Promise<{ post: Post }> {
    return this.rest.get(
      `/posts/${encodeId(idOf(target))}`,
      encodeQuery(query),
    );
  }

  async fetch(target: ResourceTarget, query?: FetchOptions): Promise<Post> {
    return (await this.get(target, query)).post;
  }

  update(target: ResourceTarget, input: CreatePostInput): Promise<{ post: Post }> {
    return this.rest.put(
      `/posts/${encodeId(idOf(target))}`,
      buildPostForm(input),
    );
  }

  delete(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.delete(`/posts/${encodeId(idOf(target))}`);
  }

  replies(target: ResourceTarget, query?: Pagination): Promise<ReplyList> {
    return this.rest.get(
      `/posts/${encodeId(idOf(target))}/replies`,
      encodeQuery(query),
    );
  }

  quotes(target: ResourceTarget, query?: Pagination): Promise<QuoteList> {
    return this.rest.get(
      `/posts/${encodeId(idOf(target))}/quotes`,
      encodeQuery(query),
    );
  }

  likes(target: ResourceTarget, query?: Pagination): Promise<UserList> {
    return this.rest.get(
      `/posts/${encodeId(idOf(target))}/likes`,
      encodeQuery(query),
    );
  }

  reposts(target: ResourceTarget, query?: Pagination): Promise<UserList> {
    return this.rest.get(
      `/posts/${encodeId(idOf(target))}/rekarots`,
      encodeQuery(query),
    );
  }

  rekarots(target: ResourceTarget, query?: Pagination): Promise<UserList> {
    return this.reposts(target, query);
  }

  conversation(target: ResourceTarget): Promise<unknown> {
    return this.rest.get(`/posts/${encodeId(idOf(target))}/conversation`);
  }

  replyTargets(target: ResourceTarget): Promise<unknown> {
    return this.rest.get(`/posts/${encodeId(idOf(target))}/reply-targets`);
  }

  leaveConversation(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.post(
      `/posts/${encodeId(idOf(target))}/conversation/leave`,
    );
  }

  analytics(target: ResourceTarget): Promise<PostAnalytics> {
    return this.rest.get(`/posts/${encodeId(idOf(target))}/analytics`);
  }

  like(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.post(`/posts/${encodeId(idOf(target))}/like`);
  }

  unlike(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.delete(`/posts/${encodeId(idOf(target))}/like`);
  }

  repost(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.post(`/posts/${encodeId(idOf(target))}/rekarot`);
  }

  unrepost(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.delete(`/posts/${encodeId(idOf(target))}/rekarot`);
  }

  bookmarks(query?: BookmarkListOptions): Promise<PostList> {
    return this.rest.get("/posts/me/bookmarks", encodeQuery(query));
  }

  bookmark(
    target: ResourceTarget,
    folderIds?: Array<Snowflake | string>,
  ): Promise<MessageEnvelope> {
    if (folderIds && folderIds.length > 0) {
      return this.rest.post(`/posts/${encodeId(idOf(target))}/bookmark`, {
        folderIds: folderIds.map((id) => Number(id)),
      });
    }
    return this.rest.post(`/posts/${encodeId(idOf(target))}/bookmark`);
  }

  unbookmark(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.delete(`/posts/${encodeId(idOf(target))}/bookmark`);
  }

  setBookmarkFolders(
    target: ResourceTarget,
    folderIds: Array<Snowflake | string>,
  ): Promise<MessageEnvelope> {
    return this.rest.put(`/posts/${encodeId(idOf(target))}/bookmark-folders`, {
      folderIds: folderIds.map((id) => Number(id)),
    });
  }

  edit(target: ResourceTarget, input: CreatePostInput): Promise<{ post: Post }> {
    return this.update(target, input);
  }

  react(target: ResourceTarget, emoji: string): Promise<MessageEnvelope> {
    return this.rest.post(`/posts/${encodeId(idOf(target))}/react`, { emoji });
  }

  unreact(target: ResourceTarget, emoji: string): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/posts/${encodeId(idOf(target))}/react/${encodeURIComponent(emoji)}`,
    );
  }

  reactionUsers(
    target: ResourceTarget,
    emoji: string,
    query?: Pagination,
  ): Promise<UserList> {
    return this.rest.get(
      `/posts/${encodeId(idOf(target))}/react/${encodeURIComponent(emoji)}/users`,
      encodeQuery(query),
    );
  }

  vote(target: ResourceTarget, optionId: Snowflake): Promise<MessageEnvelope> {
    return this.rest.post(`/posts/${encodeId(idOf(target))}/poll/vote`, {
      optionId,
    });
  }

  pollVoters(
    target: ResourceTarget,
    optionId: Snowflake | string,
    query?: Pagination,
  ): Promise<UserList> {
    return this.rest.get(
      `/posts/${encodeId(idOf(target))}/poll/options/${encodeId(optionId)}/voters`,
      encodeQuery(query),
    );
  }

  reportViews(targets: ResourceTarget[]): Promise<{ recorded: number }> {
    return this.rest.post("/posts/batch-views", {
      postIds: targets.map((target) => Number(idOf(target))),
    });
  }

  betaSurvey(
    preference: "beta" | "current",
    variant?: string,
  ): Promise<MessageEnvelope> {
    return this.rest.post("/posts/feedback/beta-survey", {
      preference,
      variant,
    });
  }

  scheduled(): Promise<{ scheduledPosts: unknown[] }> {
    return this.rest.get("/posts/scheduled/me");
  }

  cancelScheduled(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.delete(`/posts/scheduled/${encodeId(idOf(target))}`);
  }

  bookmarkFolders(): Promise<{ folders: unknown[] }> {
    return this.rest.get("/posts/me/bookmark-folders");
  }

  createBookmarkFolder(name: string): Promise<{ folder: unknown }> {
    return this.rest.post("/posts/me/bookmark-folders", { name });
  }

  updateBookmarkFolder(
    folderId: Snowflake | string,
    body: { name?: string },
  ): Promise<{ folder: unknown }> {
    return this.rest.patch(
      `/posts/me/bookmark-folders/${encodeId(folderId)}`,
      body,
    );
  }

  deleteBookmarkFolder(folderId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/posts/me/bookmark-folders/${encodeId(folderId)}`);
  }

  drafts(): Promise<{ drafts: unknown[] }> {
    return this.rest.get("/posts/drafts");
  }

  createDraft(input: CreatePostInput): Promise<{ draft: unknown }> {
    return this.rest.post("/posts/drafts", buildPostForm(input));
  }

  updateDraft(
    draftId: Snowflake | string,
    input: CreatePostInput,
  ): Promise<{ draft: unknown }> {
    return this.rest.put(
      `/posts/drafts/${encodeId(draftId)}`,
      buildPostForm(input),
    );
  }

  deleteDraft(draftId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/posts/drafts/${encodeId(draftId)}`);
  }
}

export class TimelineActions {
  constructor(private readonly rest: RestClient) {}

  home(query?: TimelineOptions): Promise<PostList> {
    return this.rest.get("/posts/timeline", encodeQuery(query));
  }

  latest(query?: Omit<TimelineOptions, "mode">): Promise<PostList> {
    return this.home({ ...query, mode: "latest" });
  }

  following(query?: Omit<TimelineOptions, "mode">): Promise<PostList> {
    return this.home({ ...query, mode: "following" });
  }

  trending(): Promise<PostList> {
    return this.rest.get("/posts/trending");
  }

  recommended(query?: RecommendedOptions): Promise<PostList> {
    return this.rest.get("/posts/recommended", encodeQuery(query));
  }
}

export class UsersActions {
  constructor(private readonly rest: RestClient) {}

  get(target: ResourceTarget, query?: FetchOptions): Promise<UserDetail> {
    return this.rest.get(
      `/users/${encodeId(usernameOrId(target))}`,
      encodeQuery(query),
    );
  }

  list(
    target: ResourceTarget,
    type: "followers" | "following" | "likes" | "media" | "replies",
    query?: Pagination,
  ): Promise<PostList | UserList> {
    return this.rest.get(
      `/users/${encodeId(usernameOrId(target))}/${type}`,
      encodeQuery(query),
    );
  }

  posts(target: ResourceTarget, query?: Pagination): Promise<PostList> {
    return this.rest.get(
      `/users/${encodeId(usernameOrId(target))}/posts`,
      encodeQuery(query),
    );
  }

  likes(target: ResourceTarget, query?: Pagination): Promise<PostList> {
    return this.rest.get(
      `/users/${encodeId(usernameOrId(target))}/likes`,
      encodeQuery(query),
    );
  }

  media(target: ResourceTarget, query?: Pagination): Promise<PostList> {
    return this.rest.get(
      `/users/${encodeId(usernameOrId(target))}/media`,
      encodeQuery(query),
    );
  }

  replies(target: ResourceTarget, query?: Pagination): Promise<PostList> {
    return this.rest.get(
      `/users/${encodeId(usernameOrId(target))}/replies`,
      encodeQuery(query),
    );
  }

  followers(target: ResourceTarget, query?: Pagination): Promise<UserList> {
    return this.rest.get(
      `/users/${encodeId(usernameOrId(target))}/followers`,
      encodeQuery(query),
    );
  }

  following(target: ResourceTarget, query?: Pagination): Promise<UserList> {
    return this.rest.get(
      `/users/${encodeId(usernameOrId(target))}/following`,
      encodeQuery(query),
    );
  }

  mutualFollowers(target: ResourceTarget, query?: Pagination): Promise<UserList> {
    return this.rest.get(
      `/users/${encodeId(usernameOrId(target))}/mutual-followers`,
      encodeQuery(query),
    );
  }

  recommended(query?: { limit?: number }): Promise<UserList> {
    return this.rest.get("/users/recommended", encodeQuery(query));
  }

  usernameQuota(): Promise<unknown> {
    return this.rest.get("/users/username/quota");
  }

  updateProfile(input: JsonObject): Promise<{ message: string; user: User }> {
    return this.rest.patch("/users/profile", input);
  }

  updateStatus(input: JsonObject): Promise<JsonObject> {
    return this.rest.patch("/users/status", input);
  }

  updateSettings(input: JsonObject): Promise<JsonObject> {
    return this.rest.patch("/users/settings", input);
  }

  updatePassword(input: {
    currentPassword: string;
    newPassword: string;
  }): Promise<MessageEnvelope> {
    return this.rest.patch("/users/password", input);
  }

  updateUsername(username: string): Promise<JsonObject> {
    return this.rest.patch("/users/username", { username });
  }

  async setPinnedPost(target: ResourceTarget | null): Promise<JsonObject> {
    const postId = target === null ? undefined : idOf(target);
    return this.rest.patch(
      "/users/profile/pinned-post",
      postId === undefined ? {} : { postId },
    );
  }

  deleteAccount(password: string): Promise<MessageEnvelope> {
    return this.rest.delete("/users/account", { data: { password } });
  }

  uploadAvatar(file: MediaInput): Promise<{ message: string; imageUrl: string }> {
    const form = new FormData();
    appendMedia(form, "avatar", file);
    return this.rest.post("/profile/avatar", form);
  }

  uploadHeader(file: MediaInput): Promise<{ message: string; imageUrl: string }> {
    const form = new FormData();
    appendMedia(form, "header", file);
    return this.rest.post("/profile/header", form);
  }

  async follow(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.post(`/follow/${encodeId(await this.resolveId(target))}`);
  }

  async unfollow(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.delete(`/follow/${encodeId(await this.resolveId(target))}`);
  }

  async block(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.post(
      `/follow/block/${encodeId(await this.resolveId(target))}`,
    );
  }

  async unblock(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/follow/block/${encodeId(await this.resolveId(target))}`,
    );
  }

  async mute(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.post(
      `/follow/mute/${encodeId(await this.resolveId(target))}`,
    );
  }

  async unmute(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/follow/mute/${encodeId(await this.resolveId(target))}`,
    );
  }

  private async resolveId(target: ResourceTarget): Promise<Snowflake | string> {
    if (typeof target === "object") return target.id;
    if (typeof target === "number") return target;
    if (/^\d+$/.test(target)) return target;
    const detail = await this.get(target);
    return detail.user.id;
  }
}

export class FollowActions {
  constructor(private readonly rest: RestClient) {}

  async follow(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.post(
      `/follow/${encodeId(await resolveUserId(this.rest, target))}`,
    );
  }

  async unfollow(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/follow/${encodeId(await resolveUserId(this.rest, target))}`,
    );
  }

  async removeFollower(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/follow/follower/${encodeId(await resolveUserId(this.rest, target))}`,
    );
  }

  pendingRequests(): Promise<{ requests: unknown[] }> {
    return this.rest.get("/follow/requests/pending");
  }

  respondToRequest(
    requestId: Snowflake | string,
    action: "accept" | "reject",
  ): Promise<MessageEnvelope> {
    return this.rest.post(
      `/follow/requests/${encodeId(requestId)}/${action}`,
    );
  }

  async enablePostNotify(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.post(
      `/follow/${encodeId(await resolveUserId(this.rest, target))}/post-notify`,
    );
  }

  async disablePostNotify(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/follow/${encodeId(await resolveUserId(this.rest, target))}/post-notify`,
    );
  }

  blocked(): Promise<UserList> {
    return this.rest.get("/follow/block");
  }

  async block(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.post(
      `/follow/block/${encodeId(await resolveUserId(this.rest, target))}`,
    );
  }

  async unblock(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/follow/block/${encodeId(await resolveUserId(this.rest, target))}`,
    );
  }

  muted(): Promise<UserList> {
    return this.rest.get("/follow/mute");
  }

  async mute(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.post(
      `/follow/mute/${encodeId(await resolveUserId(this.rest, target))}`,
    );
  }

  async unmute(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/follow/mute/${encodeId(await resolveUserId(this.rest, target))}`,
    );
  }

  async hideReposts(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.post(
      `/follow/hide-rekarots/${encodeId(await resolveUserId(this.rest, target))}`,
    );
  }

  async showReposts(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/follow/hide-rekarots/${encodeId(await resolveUserId(this.rest, target))}`,
    );
  }

  hideRekarots(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.hideReposts(target);
  }

  showRekarots(target: ResourceTarget): Promise<MessageEnvelope> {
    return this.showReposts(target);
  }
}

export class DmActions {
  constructor(private readonly rest: RestClient) {}

  groups(query?: Pagination): Promise<{
    groups: DmGroup[];
    pagination?: PageInfo;
  }> {
    return this.rest.get("/dm/groups", encodeQuery(query));
  }

  async createGroup(targets: ResourceTarget[]): Promise<DmConversation> {
    const userIds = await resolveUserIds(this.rest, targets);
    const response = await this.rest.post<{ group: DmGroup }>("/dm/groups", {
      userIds: userIds.map((userId) => Number(userId)),
    });
    return new DmConversation(this.rest, response.group);
  }

  async with(target: ResourceTarget): Promise<DmConversation> {
    const targetUserId = await resolveUserId(this.rest, target);
    const response = await this.rest.post<{ group: DmGroup }>("/dm/start", {
      targetUserId: Number(targetUserId),
    });
    return new DmConversation(this.rest, response.group);
  }

  group(group: ResourceTarget): DmConversation {
    return new DmConversation(this.rest, { id: Number(idOf(group)) });
  }

  activeCalls(): Promise<{ calls: unknown[] }> {
    return this.rest.get("/dm/calls/active");
  }

  myCalls(): Promise<{ calls: unknown[] }> {
    return this.rest.get("/dm/me/calls");
  }

  mySettings(): Promise<JsonObject> {
    return this.rest.get("/dm/me/settings");
  }

  streamUrl(): string {
    return `${this.rest.baseUrl}/api/dm/stream`;
  }

  groupStreamUrl(group: ResourceTarget): string {
    return `${this.rest.baseUrl}/api/dm/groups/${encodeId(idOf(group))}/stream`;
  }

  messagesStreamUrl(): string {
    return `${this.rest.baseUrl}/api/dm/messages/stream`;
  }

  private async resolveUserId(target: ResourceTarget): Promise<Snowflake | string> {
    return resolveUserId(this.rest, target);
  }
}

export class DmConversation {
  constructor(
    private readonly rest: RestClient,
    readonly group: DmGroup,
  ) {}

  messages(query?: CursorPagination): Promise<{
    messages: DmMessage[];
    pagination?: PageInfo;
  }> {
    return this.rest.get(
      `/dm/groups/${encodeId(this.group.id)}/messages`,
      encodeQuery(query),
    );
  }

  fetch(): Promise<{ group: DmGroup }> {
    return this.rest.get(`/dm/groups/${encodeId(this.group.id)}`);
  }

  update(body: JsonObject): Promise<{ group: DmGroup }> {
    return this.rest.patch(`/dm/groups/${encodeId(this.group.id)}`, body);
  }

  delete(): Promise<MessageEnvelope> {
    return this.rest.delete(`/dm/groups/${encodeId(this.group.id)}`);
  }

  async send(
    content: string,
    options: DmMessageOptions = {},
  ): Promise<DmMessage> {
    const response = await this.rest.post<{ message: DmMessage }>(
      `/dm/groups/${encodeId(this.group.id)}/messages`,
      buildDmForm(content, options),
    );
    return response.message;
  }

  sendMedia(
    content: string,
    attachments: MediaAttachment[],
    options: Omit<DmMessageOptions, "attachments" | "poll"> = {},
  ): Promise<DmMessage> {
    return this.send(content, { ...options, attachments });
  }

  sendPoll(
    content: string,
    poll: PollDraft,
    options: Omit<DmMessageOptions, "attachments" | "poll"> = {},
  ): Promise<DmMessage> {
    return this.send(content, { ...options, poll });
  }

  read(): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/groups/${encodeId(this.group.id)}/read`);
  }

  leave(): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/groups/${encodeId(this.group.id)}/leave`);
  }

  clear(): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/groups/${encodeId(this.group.id)}/clear`);
  }

  async addMembers(targets: ResourceTarget[]): Promise<MessageEnvelope> {
    const userIds = await resolveUserIds(this.rest, targets);
    return this.rest.post(`/dm/groups/${encodeId(this.group.id)}/members`, {
      userIds: userIds.map((userId) => Number(userId)),
    });
  }

  async addMember(target: ResourceTarget): Promise<MessageEnvelope> {
    const userId = await resolveUserId(this.rest, target);
    return this.rest.post(`/dm/groups/${encodeId(this.group.id)}/members`, {
      userId: Number(userId),
    });
  }

  async removeMember(target: ResourceTarget): Promise<MessageEnvelope> {
    const userId = await resolveUserId(this.rest, target);
    return this.rest.delete(
      `/dm/groups/${encodeId(this.group.id)}/members/${encodeId(userId)}`,
    );
  }

  respondToRequest(action: "accept" | "reject"): Promise<MessageEnvelope> {
    return this.rest.post(
      `/dm/groups/${encodeId(this.group.id)}/request/${action}`,
    );
  }

  acceptRequest(): Promise<MessageEnvelope> {
    return this.rest.post(
      `/dm/groups/${encodeId(this.group.id)}/request/accept`,
    );
  }

  rejectRequest(): Promise<MessageEnvelope> {
    return this.rest.post(
      `/dm/groups/${encodeId(this.group.id)}/request/reject`,
    );
  }

  call(): Promise<{ call: unknown | null }> {
    return this.rest.get(`/dm/groups/${encodeId(this.group.id)}/call`);
  }

  startCall(body?: JsonObject): Promise<{ call: unknown }> {
    return this.rest.post(
      `/dm/groups/${encodeId(this.group.id)}/call/start`,
      body,
    );
  }

  joinCall(body?: JsonObject): Promise<{ call: unknown }> {
    return this.rest.post(
      `/dm/groups/${encodeId(this.group.id)}/call/join`,
      body,
    );
  }

  leaveCall(body?: JsonObject): Promise<MessageEnvelope> {
    return this.rest.post(
      `/dm/groups/${encodeId(this.group.id)}/call/leave`,
      body,
    );
  }

  info(): Promise<{ group: DmGroup }> {
    return this.rest.get(`/dm/groups/${encodeId(this.group.id)}/info`);
  }

  settings(): Promise<JsonObject> {
    return this.rest.get(`/dm/groups/${encodeId(this.group.id)}/settings`);
  }

  updateSettings(body: JsonObject): Promise<JsonObject> {
    return this.rest.patch(
      `/dm/groups/${encodeId(this.group.id)}/settings`,
      body,
    );
  }

  startTyping(): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/groups/${encodeId(this.group.id)}/typing`);
  }

  stopTyping(): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/groups/${encodeId(this.group.id)}/typing/stop`);
  }

  files(): Promise<{ files: unknown[] }> {
    return this.rest.get(`/dm/groups/${encodeId(this.group.id)}/files`);
  }

  media(): Promise<{ media: unknown[] }> {
    return this.rest.get(`/dm/groups/${encodeId(this.group.id)}/media`);
  }

  pin(message: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/groups/${encodeId(this.group.id)}/pin`, {
      messageId: idOf(message),
    });
  }

  pinned(): Promise<{ messages: DmMessage[] }> {
    return this.rest.get(`/dm/groups/${encodeId(this.group.id)}/pinned`);
  }

  editMessage(message: ResourceTarget, content: string): Promise<{ message: DmMessage }> {
    return this.rest.patch(`/dm/messages/${encodeId(idOf(message))}`, {
      content,
    });
  }

  deleteMessage(message: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.delete(`/dm/messages/${encodeId(idOf(message))}`);
  }

  react(message: ResourceTarget, emoji: string): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/messages/${encodeId(idOf(message))}/reactions`, {
      emoji,
    });
  }

  removeReaction(message: ResourceTarget, emoji?: string): Promise<MessageEnvelope> {
    if (emoji !== undefined) {
      return this.rest.delete(
        `/dm/messages/${encodeId(idOf(message))}/reactions/${encodeId(emoji)}`,
      );
    }
    return this.rest.delete(`/dm/messages/${encodeId(idOf(message))}/reactions`);
  }

  vote(message: ResourceTarget, optionId: Snowflake): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/messages/${encodeId(idOf(message))}/poll/vote`, {
      optionId,
    });
  }

  pinMessage(message: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/messages/${encodeId(idOf(message))}/pin`);
  }

  unpinMessage(message: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.delete(`/dm/messages/${encodeId(idOf(message))}/pin`);
  }

  reportMessage(
    message: ResourceTarget,
    body: { reason: string; description?: string },
  ): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/messages/${encodeId(idOf(message))}/report`, body);
  }

  translateMessage(
    message: ResourceTarget,
    targetLanguage: string,
  ): Promise<{ translation: string; sourceLanguage?: string }> {
    return this.rest.post(`/dm/messages/${encodeId(idOf(message))}/translate`, {
      targetLanguage,
    });
  }
}

export class SearchActions {
  constructor(private readonly rest: RestClient) {}

  all(query: SearchOptions): Promise<SearchResult> {
    return this.rest.get("/search", encodeQuery(query));
  }

  users(query: SearchOptions): Promise<UserList> {
    return this.rest.get("/search/users", encodeQuery(query));
  }

  posts(query: PostSearchOptions): Promise<PostList> {
    return this.rest.get("/search/posts", encodeQuery(query));
  }

  hashtags(query: SearchOptions): Promise<{
    hashtags: unknown[];
    pagination?: PageInfo;
  }> {
    return this.rest.get("/search/hashtags", encodeQuery(query));
  }

  trendingTopics(limit = 5): Promise<{ trends: unknown[] }> {
    return this.rest.get("/search/trending/topics", { params: { limit } });
  }

  trendingHashtags(limit = 5): Promise<{ hashtags: unknown[] }> {
    return this.rest.get("/search/trending/hashtags", { params: { limit } });
  }

  latest(query?: CursorPagination): Promise<PostList> {
    return this.rest.get("/search/discover/latest", encodeQuery(query));
  }

  media(query?: CursorPagination): Promise<PostList> {
    return this.rest.get("/search/discover/media", encodeQuery(query));
  }

  topics(query?: CursorPagination): Promise<PostList> {
    return this.rest.get("/search/discover/topics", encodeQuery(query));
  }
}

export class NotificationsActions {
  constructor(private readonly rest: RestClient) {}

  list(query?: CursorPagination): Promise<{ notifications: unknown[]; pagination?: PageInfo }> {
    return this.rest.get("/notifications", encodeQuery(query));
  }

  unreadCount(): Promise<{ count: number }> {
    return this.rest.get("/notifications/unread/count");
  }

  groupedPosts(query?: NotificationGroupedPostsOptions): Promise<PostList> {
    return this.rest.get("/notifications/grouped-posts", encodeQuery(query));
  }

  readAll(input: NotificationReadAllOptions = {}): Promise<MessageEnvelope> {
    return this.rest.patch("/notifications/read-all", input);
  }

  read(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.patch(`/notifications/${encodeId(id)}/read`);
  }

  delete(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/notifications/${encodeId(id)}`);
  }

  deleteAll(): Promise<MessageEnvelope> {
    return this.rest.delete("/notifications/all");
  }

  registerPush(input: { token: string; deviceId?: string }): Promise<MessageEnvelope> {
    return this.rest.post("/notifications/push/register", {
      token: input.token,
      deviceId: input.deviceId ?? this.rest.auth.deviceId,
    });
  }

  unregisterPush(token: string, deviceId?: string): Promise<MessageEnvelope> {
    return this.rest.post("/notifications/push/unregister", {
      token,
      deviceId: deviceId ?? this.rest.auth.deviceId,
    });
  }
}

export class SocialActions {
  constructor(private readonly rest: RestClient) {}

  circles(): Promise<{ circles: unknown[] }> {
    return this.rest.get("/social/circles");
  }

  async createCircle(input: CircleCreateOptions): Promise<{ circle: unknown }> {
    const memberIds =
      input.memberIds === undefined
        ? undefined
        : (await resolveUserIds(this.rest, input.memberIds)).map((userId) =>
            Number(userId),
          );
    return this.rest.post("/social/circles", {
      ...input,
      memberIds,
    });
  }

  deleteCircle(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/social/circles/${encodeId(id)}`);
  }

  async addCircleMember(circleId: Snowflake | string, user: ResourceTarget): Promise<MessageEnvelope> {
    const userId = await resolveUserId(this.rest, user);
    return this.rest.post(`/social/circles/${encodeId(circleId)}/members`, {
      userId: Number(userId),
    });
  }

  async removeCircleMember(circleId: Snowflake | string, user: ResourceTarget): Promise<MessageEnvelope> {
    const userId = await resolveUserId(this.rest, user);
    return this.rest.delete(
      `/social/circles/${encodeId(circleId)}/members/${encodeId(userId)}`,
    );
  }

  lists(): Promise<{ lists: unknown[] }> {
    return this.rest.get("/social/lists");
  }

  async createList(input: SocialListCreateOptions): Promise<{ list: unknown }> {
    const memberIds =
      input.memberIds === undefined
        ? undefined
        : (await resolveUserIds(this.rest, input.memberIds)).map((userId) =>
            Number(userId),
          );
    return this.rest.post("/social/lists", {
      ...input,
      memberIds,
    });
  }

  deleteList(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/social/lists/${encodeId(id)}`);
  }

  listPosts(listId: Snowflake | string, query?: Pagination): Promise<PostList> {
    return this.rest.get(`/social/lists/${encodeId(listId)}/posts`, encodeQuery(query));
  }

  async addListMember(listId: Snowflake | string, user: ResourceTarget): Promise<MessageEnvelope> {
    const userId = await resolveUserId(this.rest, user);
    return this.rest.post(`/social/lists/${encodeId(listId)}/members`, {
      userId: Number(userId),
    });
  }

  async removeListMember(listId: Snowflake | string, user: ResourceTarget): Promise<MessageEnvelope> {
    const userId = await resolveUserId(this.rest, user);
    return this.rest.delete(
      `/social/lists/${encodeId(listId)}/members/${encodeId(userId)}`,
    );
  }

  stories(query?: Pagination): Promise<{ stories: unknown[]; pagination?: PageInfo }> {
    return this.rest.get("/social/stories", encodeQuery(query));
  }

  createStory(form: FormData): Promise<{ story: unknown }> {
    return this.rest.post("/social/stories", form);
  }

  deleteStory(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/social/stories/${encodeId(id)}`);
  }

  async userStories(user: ResourceTarget): Promise<{ stories: unknown[]; pagination?: PageInfo }> {
    return this.rest.get(
      `/social/stories/user/${encodeId(await resolveUserId(this.rest, user))}`,
    );
  }

  storyComments(id: Snowflake | string): Promise<{ comments: unknown[]; pagination?: PageInfo }> {
    return this.rest.get(`/social/stories/${encodeId(id)}/comments`);
  }

  commentStory(id: Snowflake | string, content: string): Promise<{ comment: unknown }> {
    return this.rest.post(`/social/stories/${encodeId(id)}/comments`, { content });
  }

  commentOnStory(id: Snowflake | string, content: string): Promise<{ comment: unknown }> {
    return this.commentStory(id, content);
  }

  storyViewers(id: Snowflake | string): Promise<{ viewers: unknown[] }> {
    return this.rest.get(`/social/stories/${encodeId(id)}/viewers`);
  }

  likeStory(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/social/stories/${encodeId(id)}/like`);
  }

  unlikeStory(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/social/stories/${encodeId(id)}/like`);
  }

  viewStory(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/social/stories/${encodeId(id)}/views`);
  }

  recordStoryView(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.viewStory(id);
  }

  questionInbox(): Promise<{ questions: unknown[]; pagination?: PageInfo }> {
    return this.rest.get("/social/questions/inbox");
  }

  answerQuestion(id: Snowflake | string, content: string): Promise<{ question: unknown }> {
    return this.rest.post(`/social/questions/${encodeId(id)}`, { content });
  }

  deleteQuestion(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/social/questions/${encodeId(id)}`);
  }

  async sendQuestion(input: QuestionSendOptions): Promise<MessageEnvelope> {
    return this.rest.post(
      "/social/questions/send",
      await resolveQuestionInput(this.rest, input),
    );
  }

  sendAnonymousQuestion(input: QuestionSendOptions): Promise<MessageEnvelope> {
    return this.sendQuestion(input);
  }

  async askQuestion(input: QuestionSendOptions): Promise<MessageEnvelope> {
    return this.rest.post(
      "/social/questions/ask",
      await resolveQuestionInput(this.rest, input),
    );
  }

  async postQuestion(input: QuestionSendOptions): Promise<MessageEnvelope> {
    return this.rest.post(
      "/social/questions/post",
      await resolveQuestionInput(this.rest, input),
    );
  }

  linkPreview(url: string): Promise<unknown> {
    return this.rest.get("/social/link-preview", { params: { url } });
  }

  linkPreviewImage(url: string): Promise<{ imageUrl: string | null }> {
    return this.rest.get("/social/link-preview-image", { params: { url } });
  }
}

export class RadioActions {
  constructor(private readonly rest: RestClient) {}

  create(input: RadioCreateOptions): Promise<{ space: unknown }> {
    return this.rest.post("/radio", input);
  }

  get(id: ResourceTarget): Promise<{ space: unknown }> {
    return this.rest.get(`/radio/${encodeId(idOf(id))}`);
  }

  active(): Promise<{ spaces: unknown[]; pagination?: PageInfo }> {
    return this.rest.get("/radio/active");
  }

  mine(): Promise<{ spaces: unknown[]; pagination?: PageInfo }> {
    return this.rest.get("/radio/me");
  }

  upcoming(): Promise<{ spaces: unknown[]; pagination?: PageInfo }> {
    return this.rest.get("/radio/upcoming");
  }

  iceServers(): Promise<{ iceServers: unknown[] }> {
    return this.rest.get("/radio/ice-servers");
  }

  messages(id: ResourceTarget, query?: Pagination): Promise<{ messages: unknown[]; pagination?: PageInfo }> {
    return this.rest.get(`/radio/${encodeId(idOf(id))}/messages`, encodeQuery(query));
  }

  sendMessage(id: ResourceTarget, content: string): Promise<{ message: unknown }> {
    return this.rest.post(`/radio/${encodeId(idOf(id))}/messages`, { content });
  }

  join(id: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.post(`/radio/${encodeId(idOf(id))}/join`);
  }

  leave(id: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.post(`/radio/${encodeId(idOf(id))}/leave`);
  }

  end(id: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.post(`/radio/${encodeId(idOf(id))}/end`);
  }

  requestSpeaker(id: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.post(`/radio/${encodeId(idOf(id))}/request-speaker`);
  }

  acceptSpeakerInvite(id: ResourceTarget): Promise<MessageEnvelope> {
    return this.rest.post(`/radio/${encodeId(idOf(id))}/accept-speaker-invite`);
  }

  async inviteSpeaker(id: ResourceTarget, participant: ResourceTarget): Promise<MessageEnvelope> {
    const participantId = await resolveUserId(this.rest, participant);
    return this.rest.post(
      `/radio/${encodeId(idOf(id))}/participants/${encodeId(participantId)}/invite-speaker`,
    );
  }

  async cancelSpeakerInvite(id: ResourceTarget, participant: ResourceTarget): Promise<MessageEnvelope> {
    const participantId = await resolveUserId(this.rest, participant);
    return this.rest.delete(
      `/radio/${encodeId(idOf(id))}/participants/${encodeId(participantId)}/invite-speaker`,
    );
  }

  async muteParticipant(id: ResourceTarget, participant: ResourceTarget, isMuted: boolean): Promise<MessageEnvelope> {
    const participantId = await resolveUserId(this.rest, participant);
    return this.rest.patch(
      `/radio/${encodeId(idOf(id))}/participants/${encodeId(participantId)}/mute`,
      { isMuted },
    );
  }

  async setParticipantRole(id: ResourceTarget, participant: ResourceTarget, role: string): Promise<MessageEnvelope> {
    const participantId = await resolveUserId(this.rest, participant);
    return this.rest.patch(
      `/radio/${encodeId(idOf(id))}/participants/${encodeId(participantId)}/role`,
      { role },
    );
  }

  updateSettings(id: ResourceTarget, settings: JsonObject): Promise<{ space: unknown }> {
    return this.rest.patch(`/radio/${encodeId(idOf(id))}/settings`, settings);
  }
}

export class DrawActions {
  constructor(private readonly rest: RestClient) {}

  rooms(query?: Pagination): Promise<{ rooms: unknown[] }> {
    return this.rest.get("/draw/rooms", encodeQuery(query));
  }

  myRooms(): Promise<{ rooms: unknown[] }> {
    return this.rest.get("/draw/rooms/me");
  }

  createRoom(input: JsonObject): Promise<{ room: unknown }> {
    return this.rest.post("/draw/rooms", input);
  }

  room(roomId: string): Promise<{ room: unknown }> {
    return this.rest.get(`/draw/rooms/${encodeId(roomId)}`);
  }

  deleteRoom(roomId: string): Promise<MessageEnvelope> {
    return this.rest.delete(`/draw/rooms/${encodeId(roomId)}`);
  }

  joinRoom(roomId: string, inviteCode?: string): Promise<MessageEnvelope> {
    return this.rest.post(`/draw/rooms/${encodeId(roomId)}/join`, inviteCode ? { inviteCode } : {});
  }

  chat(roomId: string, content: string): Promise<MessageEnvelope> {
    return this.rest.post(`/draw/rooms/${encodeId(roomId)}/chat`, { content });
  }

  rotateInvite(roomId: string): Promise<{ inviteCode: string }> {
    return this.rest.post(`/draw/rooms/${encodeId(roomId)}/invite/rotate`);
  }

  syncLayers(roomId: string, layers: unknown): Promise<MessageEnvelope> {
    return this.rest.put(`/draw/rooms/${encodeId(roomId)}/layers`, layers);
  }
}

export class NewsActions extends NewsApi {
  list(query?: NewsListOptions): ReturnType<NewsApi["list"]> {
    return super.list(query);
  }

  get(slugOrId: Snowflake | string): ReturnType<NewsApi["fetch"]> {
    return this.fetch(slugOrId);
  }

  comment(
    id: Snowflake | string,
    content: string,
  ): ReturnType<NewsApi["addComment"]> {
    return this.addComment(id, content);
  }
}

export class BoardsActions extends BoardsApi {
  get(slug: string): ReturnType<BoardsApi["fetch"]> {
    return this.fetch(slug);
  }

  thread(
    slug: string,
    threadId: Snowflake | string,
  ): ReturnType<BoardsApi["fetchThread"]> {
    return this.fetchThread(slug, threadId);
  }

  reply(
    slug: string,
    threadId: Snowflake | string,
    form: FormData,
  ): ReturnType<BoardsApi["replyThread"]> {
    return this.replyThread(slug, threadId, form);
  }
}

export class ApiKeyActions extends ApiKeysApi {
  rotate(id: Snowflake | string): ReturnType<ApiKeysApi["regenerate"]> {
    return this.regenerate(id);
  }
}

export class DeveloperActions extends DeveloperApi {
  constructor(private readonly actionRest: RestClient) {
    super(actionRest);
  }

  getPost(id: Snowflake | string): ReturnType<DeveloperApi["fetchPost"]> {
    return this.fetchPost(id);
  }

  repost(id: Snowflake | string): ReturnType<DeveloperApi["rekarot"]> {
    return this.rekarot(id);
  }

  unrepost(id: Snowflake | string): ReturnType<DeveloperApi["unrekarot"]> {
    return this.unrekarot(id);
  }

  async getUser(id: ResourceTarget): Promise<Awaited<ReturnType<DeveloperApi["fetchUser"]>>> {
    return this.fetchUser(await resolveUserId(this.actionRest, id));
  }

  override async fetchUser(
    id: ResourceTarget,
  ): Promise<Awaited<ReturnType<DeveloperApi["fetchUser"]>>> {
    return super.fetchUser(await resolveUserId(this.actionRest, id));
  }

  override async userFollowers(
    id: ResourceTarget,
  ): Promise<Awaited<ReturnType<DeveloperApi["userFollowers"]>>> {
    return super.userFollowers(await resolveUserId(this.actionRest, id));
  }

  override async userFollowing(
    id: ResourceTarget,
  ): Promise<Awaited<ReturnType<DeveloperApi["userFollowing"]>>> {
    return super.userFollowing(await resolveUserId(this.actionRest, id));
  }

  override async follow(
    id: ResourceTarget,
  ): Promise<Awaited<ReturnType<DeveloperApi["follow"]>>> {
    return super.follow(await resolveUserId(this.actionRest, id));
  }

  override async unfollow(
    id: ResourceTarget,
  ): Promise<Awaited<ReturnType<DeveloperApi["unfollow"]>>> {
    return super.unfollow(await resolveUserId(this.actionRest, id));
  }
}

export class LegalActions extends LegalApi {}

export class MiscActions extends MiscApi {}

export class AdminActions extends AdminApi {
  constructor(private readonly actionRest: RestClient) {
    super(actionRest);
  }

  async user(userId: ResourceTarget): Promise<Awaited<ReturnType<AdminApi["fetchUser"]>>> {
    return this.fetchUser(userId);
  }

  override async fetchUser(
    userId: ResourceTarget,
  ): Promise<Awaited<ReturnType<AdminApi["fetchUser"]>>> {
    return super.fetchUser(await resolveUserId(this.actionRest, userId));
  }

  override async banUser(
    userId: ResourceTarget,
    input: Parameters<AdminApi["banUser"]>[1] = {},
  ): Promise<Awaited<ReturnType<AdminApi["banUser"]>>> {
    return super.banUser(await resolveUserId(this.actionRest, userId), input);
  }

  override async unbanUser(
    userId: ResourceTarget,
  ): Promise<Awaited<ReturnType<AdminApi["unbanUser"]>>> {
    return super.unbanUser(await resolveUserId(this.actionRest, userId));
  }

  override async verifyUser(
    userId: ResourceTarget,
    body: Parameters<AdminApi["verifyUser"]>[1] = {},
  ): Promise<Awaited<ReturnType<AdminApi["verifyUser"]>>> {
    return super.verifyUser(await resolveUserId(this.actionRest, userId), body);
  }

  override async setUserFlags(
    userId: ResourceTarget,
    flags: Parameters<AdminApi["setUserFlags"]>[1],
  ): Promise<Awaited<ReturnType<AdminApi["setUserFlags"]>>> {
    return super.setUserFlags(await resolveUserId(this.actionRest, userId), flags);
  }

  override async updateUserAccount(
    userId: ResourceTarget,
    body: Parameters<AdminApi["updateUserAccount"]>[1],
  ): Promise<Awaited<ReturnType<AdminApi["updateUserAccount"]>>> {
    return super.updateUserAccount(
      await resolveUserId(this.actionRest, userId),
      body,
    );
  }

  override async setUserOfficialMark(
    userId: ResourceTarget,
    mark: Parameters<AdminApi["setUserOfficialMark"]>[1],
  ): Promise<Awaited<ReturnType<AdminApi["setUserOfficialMark"]>>> {
    return super.setUserOfficialMark(
      await resolveUserId(this.actionRest, userId),
      mark,
    );
  }

  override async setUserEmail(
    userId: ResourceTarget,
    email: string,
  ): Promise<Awaited<ReturnType<AdminApi["setUserEmail"]>>> {
    return super.setUserEmail(await resolveUserId(this.actionRest, userId), email);
  }

  override async setUserPassword(
    userId: ResourceTarget,
    password: string,
  ): Promise<Awaited<ReturnType<AdminApi["setUserPassword"]>>> {
    return super.setUserPassword(
      await resolveUserId(this.actionRest, userId),
      password,
    );
  }

  override async setUserRole(
    userId: ResourceTarget,
    role: string,
  ): Promise<Awaited<ReturnType<AdminApi["setUserRole"]>>> {
    return super.setUserRole(await resolveUserId(this.actionRest, userId), role);
  }

  override async userSessions(
    userId: ResourceTarget,
  ): Promise<Awaited<ReturnType<AdminApi["userSessions"]>>> {
    return super.userSessions(await resolveUserId(this.actionRest, userId));
  }

  override async userPosts(
    userId: ResourceTarget,
  ): Promise<Awaited<ReturnType<AdminApi["userPosts"]>>> {
    return super.userPosts(await resolveUserId(this.actionRest, userId));
  }

  override async userReports(
    userId: ResourceTarget,
  ): Promise<Awaited<ReturnType<AdminApi["userReports"]>>> {
    return super.userReports(await resolveUserId(this.actionRest, userId));
  }

  override async userBans(
    userId: ResourceTarget,
  ): Promise<Awaited<ReturnType<AdminApi["userBans"]>>> {
    return super.userBans(await resolveUserId(this.actionRest, userId));
  }

  override async userNotes(
    userId: ResourceTarget,
  ): Promise<Awaited<ReturnType<AdminApi["userNotes"]>>> {
    return super.userNotes(await resolveUserId(this.actionRest, userId));
  }

  override async userHistory(
    userId: ResourceTarget,
  ): Promise<Awaited<ReturnType<AdminApi["userHistory"]>>> {
    return super.userHistory(await resolveUserId(this.actionRest, userId));
  }

  override async warnUser(
    userId: ResourceTarget,
    body: Parameters<AdminApi["warnUser"]>[1] = {},
  ): Promise<Awaited<ReturnType<AdminApi["warnUser"]>>> {
    return super.warnUser(await resolveUserId(this.actionRest, userId), body);
  }

  override async deleteUser(
    userId: ResourceTarget,
  ): Promise<Awaited<ReturnType<AdminApi["deleteUser"]>>> {
    return super.deleteUser(await resolveUserId(this.actionRest, userId));
  }

  override async userRestrict(
    userId: ResourceTarget,
  ): Promise<Awaited<ReturnType<AdminApi["userRestrict"]>>> {
    return super.userRestrict(await resolveUserId(this.actionRest, userId));
  }

  override async userSuspend(
    userId: ResourceTarget,
  ): Promise<Awaited<ReturnType<AdminApi["userSuspend"]>>> {
    return super.userSuspend(await resolveUserId(this.actionRest, userId));
  }

  post(postId: Snowflake | string): ReturnType<AdminApi["fetchPost"]> {
    return this.fetchPost(postId);
  }

  report(reportId: Snowflake | string): ReturnType<AdminApi["fetchReport"]> {
    return this.fetchReport(reportId);
  }

  news(query?: Parameters<AdminApi["newsList"]>[0]): ReturnType<AdminApi["newsList"]> {
    return this.newsList(query);
  }

  announcement(
    announcementId: Snowflake | string,
  ): ReturnType<AdminApi["fetchAnnouncement"]> {
    return this.fetchAnnouncement(announcementId);
  }

  badge(badgeId: Snowflake | string): ReturnType<AdminApi["fetchBadge"]> {
    return this.fetchBadge(badgeId);
  }

  ban(banId: Snowflake | string): ReturnType<AdminApi["fetchBan"]> {
    return this.fetchBan(banId);
  }

  emojiOne(emojiId: Snowflake | string): ReturnType<AdminApi["fetchEmoji"]> {
    return this.fetchEmoji(emojiId);
  }

  frame(frameId: Snowflake | string): ReturnType<AdminApi["fetchFrame"]> {
    return this.fetchFrame(frameId);
  }

  ipBan(banId: Snowflake | string): ReturnType<AdminApi["fetchIpBan"]> {
    return this.fetchIpBan(banId);
  }

  sticker(stickerId: Snowflake | string): ReturnType<AdminApi["fetchSticker"]> {
    return this.fetchSticker(stickerId);
  }

  theme(themeId: Snowflake | string): ReturnType<AdminApi["fetchTheme"]> {
    return this.fetchTheme(themeId);
  }
}

export const karotter = {
  create(options: KarotterOptions = {}): Karotter {
    return new Karotter(options);
  },

  async login(
    input: LoginOptions,
    options: KarotterOptions = {},
  ): Promise<Karotter> {
    const session = new Karotter(options);
    await session.login(input);
    return session;
  },

  async register(
    input: RegisterInput,
    options: KarotterOptions = {},
  ): Promise<Karotter> {
    const session = new Karotter(options);
    await session.register(input);
    return session;
  },

  async fromToken(
    input: TokenLoginOptions,
    options: KarotterOptions = {},
  ): Promise<Karotter> {
    const session = new Karotter(options);
    await session.useToken(input);
    return session;
  },
} as const;

function toPostInput(options: PostOptions): CreatePostInput {
  const { visibility, replyRestriction, ...rest } = options;
  const input: CreatePostInput = {
    ...rest,
    visibility: normalizeVisibility(visibility ?? DEFAULT_POST_VISIBILITY),
    replyRestriction: normalizeReplyRestriction(
      replyRestriction ?? DEFAULT_REPLY_RESTRICTION,
    ),
  };
  return input;
}

function buildPostForm(
  input: CreatePostInput,
  options: { requireBody?: boolean } = {},
): FormData {
  validatePostInput(input, options);
  const form = new FormData();
  if (input.content !== undefined) form.append("content", input.content);
  if (input.parentId !== undefined)
    appendField(form, "parentId", String(input.parentId));
  if (input.quotedPostId !== undefined)
    appendField(form, "quotedPostId", String(input.quotedPostId));
  if (input.questionId !== undefined)
    appendField(form, "questionId", String(input.questionId));
  if (input.excludedMentions && input.excludedMentions.length > 0)
    appendJson(form, "excludedMentions", input.excludedMentions);
  const shouldAgeGate =
    input.minimumAge !== null &&
    input.minimumAge !== undefined &&
    input.minimumAge >= 18;
  appendField(form, "isAiGenerated", input.isAiGenerated ?? false);
  appendField(form, "isPromotional", input.isPromotional ?? false);
  appendField(form, "isR18", input.isR18 ?? shouldAgeGate);
  appendField(form, "hideFromMinors", input.hideFromMinors ?? shouldAgeGate);
  if (input.minimumAge !== null && input.minimumAge !== undefined)
    appendField(form, "minimumAge", String(input.minimumAge));
  if (input.maximumAge !== null && input.maximumAge !== undefined)
    appendField(form, "maximumAge", String(input.maximumAge));
  appendField(form, "visibility", input.visibility ?? DEFAULT_POST_VISIBILITY);
  if (input.viewerCircleId !== undefined)
    appendField(form, "viewerCircleId", String(input.viewerCircleId));
  appendField(
    form,
    "replyRestriction",
    input.replyRestriction ?? DEFAULT_REPLY_RESTRICTION,
  );
  if (input.replyCircleId !== undefined)
    appendField(form, "replyCircleId", String(input.replyCircleId));
  if (input.scheduledFor) {
    const scheduledFor =
      input.scheduledFor instanceof Date
        ? input.scheduledFor.toISOString()
        : input.scheduledFor;
    appendField(form, "scheduledFor", scheduledFor);
  }
  if (input.poll) {
    appendJson(form, "pollOptions", input.poll.options);
    appendField(
      form,
      "pollDurationHours",
      String(input.poll.durationHours ?? DEFAULT_POLL_DURATION_HOURS),
    );
    appendField(
      form,
      "pollIsAnonymous",
      input.poll.isAnonymous ?? DEFAULT_POLL_IS_ANONYMOUS,
    );
    const pollOptionImages = input.poll.optionImages ?? [];
    appendJson(
      form,
      "pollOptionImageIndices",
      pollOptionImages.map((entry) => entry.index),
    );
    if (pollOptionImages.length > 0) {
      for (const entry of pollOptionImages) {
        appendMedia(form, "pollOptionImages", entry.file);
      }
    }
  }
  const media = input.media ?? [];
  for (const item of media) appendMedia(form, "media", item.file);
  appendJson(
    form,
    "mediaAlts",
    media.map((item) => item.alt ?? ""),
  );
  appendJson(
    form,
    "mediaSpoilerFlags",
    media.map((item) => Boolean(item.spoiler)),
  );
  appendJson(
    form,
    "mediaR18Flags",
    media.map((item) => Boolean(item.r18)),
  );
  return form;
}

function validatePostInput(
  input: CreatePostInput,
  options: { requireBody?: boolean },
): void {
  const hasContent =
    input.content !== undefined && input.content.trim().length > 0;
  const hasMedia = (input.media?.length ?? 0) > 0;
  const hasPoll = input.poll !== undefined;

  if (options.requireBody && !hasContent && !hasMedia && !hasPoll) {
    throw new ValidationError("post must contain content, media, or poll", {
      code: "VALIDATION_FAILED",
    });
  }
  if (input.content !== undefined) assertNonEmptyText(input.content, "content");
  if (input.visibility === "CIRCLE" && input.viewerCircleId === undefined) {
    throw new ValidationError("viewerCircleId is required for circle posts", {
      code: "VALIDATION_FAILED",
    });
  }
  if (
    input.replyRestriction === "CIRCLE" &&
    input.replyCircleId === undefined
  ) {
    throw new ValidationError(
      "replyCircleId is required for circle reply restriction",
      { code: "VALIDATION_FAILED" },
    );
  }
  if (input.poll !== undefined) {
    assertAtLeast(input.poll.options.length, 2, "poll.options");
    assertAtMost(input.poll.options.length, 4, "poll.options");
    for (const option of input.poll.options) {
      assertNonEmptyText(option, "poll.options[]");
    }
    if (input.poll.durationHours !== undefined) {
      assertPositiveInteger(input.poll.durationHours, "poll.durationHours");
    }
  }
  if (input.scheduledFor !== undefined) {
    assertValidDate(input.scheduledFor, "scheduledFor");
  }
}

function buildDmForm(
  content: string,
  options: DmMessageOptions,
): FormData {
  const hasContent = content.trim().length > 0;
  const attachments = options.attachments ?? [];
  const hasPoll = options.poll !== undefined;
  if (!hasContent && attachments.length === 0 && !hasPoll) {
    throw new ValidationError(
      "dm message must contain content, attachments, or poll",
      { code: "VALIDATION_FAILED" },
    );
  }
  if (content.length > 0) assertNonEmptyText(content, "content");
  const form = new FormData();
  if (hasContent) form.append("content", content);
  if (options.replyToId !== undefined)
    appendField(form, "replyToId", String(options.replyToId));
  if (options.poll) {
    assertAtLeast(options.poll.options.length, 2, "poll.options");
    appendJson(form, "pollOptions", options.poll.options);
    if (typeof options.poll.durationHours === "number") {
      appendField(form, "pollDurationHours", String(options.poll.durationHours));
    }
  }
  for (const item of attachments) appendMedia(form, "attachments", item.file);
  if (attachments.length > 0) {
    appendJson(
      form,
      "attachmentAlts",
      attachments.map((item) => item.alt ?? ""),
    );
    appendJson(
      form,
      "attachmentSpoilerFlags",
      attachments.map((item) => Boolean(item.spoiler)),
    );
    appendJson(
      form,
      "attachmentR18Flags",
      attachments.map((item) => Boolean(item.r18)),
    );
  }
  return form;
}

function idOf(target: ResourceTarget): Snowflake | string {
  return typeof target === "object" ? target.id : target;
}

function usernameOrId(target: ResourceTarget): Snowflake | string {
  if (typeof target === "string") return stripAt(target);
  return idOf(target);
}

function stripAt(value: string): string {
  return value.startsWith("@") ? value.slice(1) : value;
}

async function resolveUserId(
  rest: RestClient,
  target: ResourceTarget,
): Promise<Snowflake | string> {
  if (typeof target === "object") return target.id;
  if (typeof target === "number") return target;
  if (/^\d+$/.test(target)) return target;
  const detail = await rest.get<UserDetail>(`/users/${encodeId(stripAt(target))}`);
  return detail.user.id;
}

function resolveUserIds(
  rest: RestClient,
  targets: ResourceTarget[],
): Promise<Array<Snowflake | string>> {
  return Promise.all(targets.map((target) => resolveUserId(rest, target)));
}

async function resolveQuestionInput(
  rest: RestClient,
  input: QuestionSendOptions,
): Promise<{ targetUserId: number; content: string }> {
  return {
    targetUserId: Number(await resolveUserId(rest, input.targetUserId)),
    content: input.content,
  };
}

function normalizeVisibility(value: VisibilityOption): Visibility {
  const upper = value.toUpperCase();
  if (upper === "PUBLIC" || upper === "FOLLOWERS" || upper === "CIRCLE") {
    return upper;
  }
  throw new ValidationError(`unsupported visibility: ${value}`, {
    code: "VALIDATION_FAILED",
  });
}

function normalizeReplyRestriction(
  value: ReplyRestrictionOption,
): ReplyRestriction {
  const upper = value.toUpperCase();
  if (
    upper === "EVERYONE" ||
    upper === "FOLLOWING" ||
    upper === "MENTIONED" ||
    upper === "CIRCLE"
  ) {
    return upper;
  }
  throw new ValidationError(`unsupported replyRestriction: ${value}`, {
    code: "VALIDATION_FAILED",
  });
}
