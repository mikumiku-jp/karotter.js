import type { RestClient } from "../RestClient.js";
import type { Board, BoardReply, BoardThread } from "../../structures/Board.js";
import type { DmGroup, DmMessage } from "../../structures/Dm.js";
import type { NewsArticle, NewsArticleInput } from "../../structures/News.js";
import type { Notification, NotificationType } from "../../structures/Notification.js";
import type { ApiKey } from "../../structures/Auth.js";
import type { Post } from "../../structures/Post.js";
import type { Hashtag } from "../../structures/Social.js";
import type { User } from "../../structures/User.js";
import type { Story, StoryComment } from "../../structures/Social.js";
import type { MediaInput } from "../../util/form.js";
import type {
  CursorPagination,
  JsonObject,
  MessageEnvelope,
  PageInfo,
  Pagination,
  Snowflake,
} from "../../util/types.js";
import { encodeId, encodeQuery } from "../utils.js";
import { appendField, appendJson, appendMedia } from "../../util/form.js";

export type DeveloperSearchType = "posts" | "users" | "hashtags";

export interface DeveloperSearchQuery {
  q: string;
  page?: number;
  type?: DeveloperSearchType;
  limit?: number;
  cursor?: string;
}

export interface DeveloperSearchResult {
  type: DeveloperSearchType;
  results: Array<Post | User | Hashtag>;
  pagination?: PageInfo;
}


export interface DeveloperListQuery {
  page?: number;
  limit?: number;
}

export interface DeveloperPostListQuery extends DeveloperListQuery {
  userId?: Snowflake | string;
}

export interface DeveloperPostCreateInput {
  content: string;
  parentId?: Snowflake | string;
  quotedPostId?: Snowflake | string;
  visibility?: "public" | "followers" | "circle" | "mutual";
  media?: MediaInput[];
  pollOptions?: string[];
  pollDurationHours?: number;
  minimumAge?: number;
  maximumAge?: number;
  isR18?: boolean;
}

export interface DeveloperPostUpdateInput {
  content?: string;
  visibility?: string;
  viewerCircleId?: Snowflake | string;
  replyRestriction?: string;
  replyCircleId?: Snowflake | string;
  isR18?: boolean;
  hideFromMinors?: boolean;
  isAiGenerated?: boolean;
  isPromotional?: boolean;
  mediaSpoilerFlags?: boolean[];
  mediaR18Flags?: boolean[];
}

export interface DeveloperNewsCreateInput
  extends Omit<NewsArticleInput, "category"> {
  category: string;
}

export interface DeveloperDmImagesInput {
  images: MediaInput[];
  content?: string;
  attachmentAlts?: string[];
  attachmentSpoilerFlags?: boolean[];
  attachmentR18Flags?: boolean[];
}

export interface DeveloperReactionSummary {
  emoji: string;
  count: number;
  reacted: boolean;
}

export interface DeveloperFollowRequest extends JsonObject {
  id: Snowflake;
}
export interface TweetV2 {
  id: string;
  text: string;
  author_id?: string;
  created_at?: string;
  conversation_id?: string;
  in_reply_to_user_id?: string;
  attachments?: { media_keys?: string[] };
  [extra: string]: JsonObject[keyof JsonObject];
}

export interface UserV2 {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
  description?: string;
  [extra: string]: JsonObject[keyof JsonObject];
}

export interface DeveloperUsage {
  requests?: number;
  remaining?: number;
  resetAt?: string;
  byEndpoint?: Record<string, number>;
  [extra: string]: JsonObject[keyof JsonObject];
}

export interface TwitterCompatMeta extends JsonObject {
  result_count?: number;
  next_token?: string;
  previous_token?: string;
}

export class DeveloperApi {
  readonly v2: TwitterCompatApi;

  constructor(private readonly rest: RestClient) {
    this.v2 = new TwitterCompatApi(rest);
  }

  posts(
    query?: DeveloperPostListQuery,
  ): Promise<{ posts: Post[]; hasMore?: boolean; pagination?: PageInfo }> {
    return this.rest.get("/developer/posts", encodeQuery(query));
  }

  fetchPost(id: Snowflake | string): Promise<{ post: Post }> {
    return this.rest.get(`/developer/posts/${encodeId(id)}`);
  }

  postReplies(
    id: Snowflake | string,
    query?: DeveloperListQuery,
  ): Promise<{ replies: Post[]; hasMore?: boolean; pagination?: PageInfo }> {
    return this.rest.get(
      `/developer/posts/${encodeId(id)}/replies`,
      encodeQuery(query),
    );
  }

  postQuotes(
    id: Snowflake | string,
    query?: DeveloperListQuery,
  ): Promise<{ quotes: Post[]; hasMore?: boolean; pagination?: PageInfo }> {
    return this.rest.get(
      `/developer/posts/${encodeId(id)}/quotes`,
      encodeQuery(query),
    );
  }

  createPost(input: DeveloperPostCreateInput): Promise<{ post: Post }> {
    const form = new FormData();
    appendField(form, "content", input.content);
    appendField(form, "parentId", input.parentId);
    appendField(form, "quotedPostId", input.quotedPostId);
    appendField(form, "visibility", input.visibility);
    appendJson(form, "pollOptions", input.pollOptions);
    appendField(form, "pollDurationHours", input.pollDurationHours);
    appendField(form, "minimumAge", input.minimumAge);
    appendField(form, "maximumAge", input.maximumAge);
    appendField(form, "isR18", input.isR18);
    for (const media of input.media ?? []) appendMedia(form, "media", media);
    return this.rest.post("/developer/posts", form);
  }

  updatePost(
    id: Snowflake | string,
    input: DeveloperPostUpdateInput,
  ): Promise<{ message: string; post: Post }> {
    return this.rest.patch(`/developer/posts/${encodeId(id)}`, input);
  }

  deletePost(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/developer/posts/${encodeId(id)}`);
  }

  like(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/developer/posts/${encodeId(id)}/like`);
  }

  unlike(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/developer/posts/${encodeId(id)}/like`);
  }

  bookmark(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/developer/posts/${encodeId(id)}/bookmark`);
  }

  unbookmark(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/developer/posts/${encodeId(id)}/bookmark`);
  }

  setBookmarkFolders(
    id: Snowflake | string,
    folderIds: Array<Snowflake | string>,
  ): Promise<MessageEnvelope> {
    return this.rest.put(`/developer/posts/${encodeId(id)}/bookmark-folders`, {
      folderIds,
    });
  }

  rekarot(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/developer/posts/${encodeId(id)}/rekarot`);
  }

  unrekarot(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/developer/posts/${encodeId(id)}/rekarot`);
  }

  reactions(
    id: Snowflake | string,
  ): Promise<{ reactions: DeveloperReactionSummary[] }> {
    return this.rest.get(`/developer/posts/${encodeId(id)}/reactions`);
  }

  react(id: Snowflake | string, emoji: string): Promise<MessageEnvelope> {
    return this.rest.post(`/developer/posts/${encodeId(id)}/react`, { emoji });
  }

  unreact(
    id: Snowflake | string,
    emoji: string,
  ): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/developer/posts/${encodeId(id)}/react/${encodeId(emoji)}`,
    );
  }

  timeline(
    query?: DeveloperListQuery,
  ): Promise<{ posts: Post[]; hasMore: boolean }> {
    return this.rest.get("/developer/timeline", encodeQuery(query));
  }

  search(query: DeveloperSearchQuery): Promise<DeveloperSearchResult> {
    return this.rest.get("/developer/search", encodeQuery(query));
  }

  me(): Promise<User> {
    return this.rest.get("/developer/users/me");
  }

  fetchUser(id: Snowflake | string): Promise<{ user: User }> {
    return this.rest.get(`/developer/users/${encodeId(id)}`);
  }

  userByUsername(username: string): Promise<{ user: User }> {
    return this.rest.get(
      `/developer/users/by/username/${encodeId(username)}`,
    );
  }

  userFollowers(
    id: Snowflake | string,
    query?: CursorPagination,
  ): Promise<{ users: User[]; pagination?: PageInfo }> {
    return this.rest.get(
      `/developer/users/${encodeId(id)}/followers`,
      encodeQuery(query),
    );
  }

  userFollowing(
    id: Snowflake | string,
    query?: CursorPagination,
  ): Promise<{ users: User[]; pagination?: PageInfo }> {
    return this.rest.get(
      `/developer/users/${encodeId(id)}/following`,
      encodeQuery(query),
    );
  }

  follow(
    id: Snowflake | string,
  ): Promise<{ following: boolean; pending?: boolean; message?: string }> {
    return this.rest.post(`/developer/users/${encodeId(id)}/follow`);
  }

  unfollow(
    id: Snowflake | string,
  ): Promise<{ following: boolean; message?: string }> {
    return this.rest.delete(`/developer/users/${encodeId(id)}/follow`);
  }

  followState(username: string): Promise<JsonObject> {
    return this.rest.get(`/developer/follows/${encodeId(username)}`);
  }

  followRequests(): Promise<{ requests: DeveloperFollowRequest[] }> {
    return this.rest.get("/developer/follow-requests");
  }

  acceptFollowRequest(
    requestId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.post(
      `/developer/follow-requests/${encodeId(requestId)}/accept`,
    );
  }

  rejectFollowRequest(
    requestId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.post(
      `/developer/follow-requests/${encodeId(requestId)}/reject`,
    );
  }

  bookmarks(
    query?: DeveloperListQuery & { folderId?: Snowflake | string },
  ): Promise<{ posts: Post[]; hasMore?: boolean; pagination?: PageInfo }> {
    return this.rest.get("/developer/bookmarks", encodeQuery(query));
  }

  news(
    query?: DeveloperListQuery,
  ): Promise<{ articles: NewsArticle[]; pagination?: PageInfo }> {
    return this.rest.get("/developer/news", encodeQuery(query));
  }

  createNews(
    input: DeveloperNewsCreateInput,
  ): Promise<{ article: NewsArticle }> {
    return this.rest.post("/developer/news", input);
  }

  uploadNewsMedia(media: MediaInput[]): Promise<JsonObject> {
    const form = new FormData();
    for (const attachment of media) appendMedia(form, "media", attachment);
    return this.rest.post("/developer/news/uploads", form);
  }

  fetchNews(id: Snowflake | string): Promise<{ article: NewsArticle }> {
    return this.rest.get(`/developer/news/${encodeId(id)}`);
  }

  updateNews(
    id: Snowflake | string,
    input: Partial<NewsArticleInput>,
  ): Promise<{ article: NewsArticle }> {
    return this.rest.put(`/developer/news/${encodeId(id)}`, input);
  }

  submitNews(id: Snowflake | string): Promise<{ article: NewsArticle }> {
    return this.rest.post(`/developer/news/${encodeId(id)}/submit`);
  }

  stories(): Promise<{ stories: Story[] }> {
    return this.rest.get("/developer/stories");
  }

  userStories(username: string): Promise<{ stories: Story[] }> {
    return this.rest.get(
      `/developer/stories/user/${encodeId(username)}`,
    );
  }

  likeStory(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/developer/stories/${encodeId(id)}/like`);
  }

  unlikeStory(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/developer/stories/${encodeId(id)}/like`);
  }

  storyComments(
    id: Snowflake | string,
  ): Promise<{ comments: StoryComment[] }> {
    return this.rest.get(`/developer/stories/${encodeId(id)}/comments`);
  }

  commentStory(
    id: Snowflake | string,
    content: string,
  ): Promise<{ comment: StoryComment }> {
    return this.rest.post(`/developer/stories/${encodeId(id)}/comments`, {
      content,
    });
  }

  boards(): Promise<{ boards: Board[] }> {
    return this.rest.get("/developer/boards");
  }

  board(
    slug: string,
    query?: { limit?: number },
  ): Promise<{ board: Board; threads: BoardThread[]; pagination?: PageInfo }> {
    return this.rest.get(
      `/developer/boards/${encodeId(slug)}`,
      encodeQuery(query),
    );
  }

  boardThread(
    id: Snowflake | string,
  ): Promise<{ thread: BoardThread; replies: BoardReply[] }> {
    return this.rest.get(`/developer/boards/threads/${encodeId(id)}`);
  }

  createBoardThread(
    slug: string,
    input: { title: string; content: string },
  ): Promise<{ thread: BoardThread }> {
    return this.rest.post(
      `/developer/boards/${encodeId(slug)}/threads`,
      input,
    );
  }

  replyToBoardThread(
    id: Snowflake | string,
    content: string,
  ): Promise<{ reply: BoardReply }> {
    return this.rest.post(
      `/developer/boards/threads/${encodeId(id)}/replies`,
      { content },
    );
  }

  reactToBoardThread(
    id: Snowflake | string,
    emoji: string,
  ): Promise<MessageEnvelope> {
    return this.rest.post(
      `/developer/boards/threads/${encodeId(id)}/react`,
      { emoji },
    );
  }

  reactToBoardReply(
    id: Snowflake | string,
    emoji: string,
  ): Promise<MessageEnvelope> {
    return this.rest.post(
      `/developer/boards/replies/${encodeId(id)}/react`,
      { emoji },
    );
  }

  dmGroups(
    query?: DeveloperListQuery,
  ): Promise<{ groups: DmGroup[]; pagination?: PageInfo }> {
    return this.rest.get("/developer/dm/groups", encodeQuery(query));
  }

  dmMessages(
    groupId: Snowflake | string,
    query?: CursorPagination,
  ): Promise<{ messages: DmMessage[]; pagination?: PageInfo }> {
    return this.rest.get(
      `/developer/dm/groups/${encodeId(groupId)}/messages`,
      encodeQuery(query),
    );
  }

  sendDmMessage(
    groupId: Snowflake | string,
    content: string,
  ): Promise<{ message: DmMessage }> {
    return this.rest.post(
      `/developer/dm/groups/${encodeId(groupId)}/messages`,
      { content },
    );
  }

  sendDmImages(
    groupId: Snowflake | string,
    input: DeveloperDmImagesInput,
  ): Promise<{ message: DmMessage }> {
    const form = new FormData();
    appendField(form, "content", input.content);
    appendJson(form, "attachmentAlts", input.attachmentAlts);
    appendJson(
      form,
      "attachmentSpoilerFlags",
      input.attachmentSpoilerFlags,
    );
    appendJson(form, "attachmentR18Flags", input.attachmentR18Flags);
    for (const image of input.images) appendMedia(form, "images", image);
    return this.rest.post(
      `/developer/dm/groups/${encodeId(groupId)}/messages/images`,
      form,
    );
  }

  markDmRead(groupId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(
      `/developer/dm/groups/${encodeId(groupId)}/read`,
    );
  }

  notifications(
    query?: DeveloperListQuery & { type?: NotificationType },
  ): Promise<{ notifications: Notification[]; pagination?: PageInfo }> {
    return this.rest.get("/developer/notifications", encodeQuery(query));
  }

  unreadNotificationCount(): Promise<{ count: number }> {
    return this.rest.get("/developer/notifications/unread/count");
  }

  markNotificationRead(
    id: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.patch(
      `/developer/notifications/${encodeId(id)}/read`,
    );
  }

  markAllNotificationsRead(type?: NotificationType): Promise<MessageEnvelope> {
    return this.rest.patch(
      "/developer/notifications/read-all",
      undefined,
      encodeQuery({ type }),
    );
  }

  deleteNotification(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/developer/notifications/${encodeId(id)}`,
    );
  }

  postSchema(): Promise<JsonObject> {
    return this.rest.get("/developer/schemas/post");
  }

  userSchema(): Promise<JsonObject> {
    return this.rest.get("/developer/schemas/user");
  }

  pollSchema(): Promise<JsonObject> {
    return this.rest.get("/developer/schemas/poll");
  }

  timelineItemSchema(): Promise<JsonObject> {
    return this.rest.get("/developer/schemas/timeline-item");
  }

  apiKeys(): Promise<{ apiKeys: ApiKey[] }> {
    return this.rest.get("/developer/apikeys");
  }

  usage(): Promise<DeveloperUsage> {
    return this.rest.get("/developer/usage");
  }
}

export class TwitterCompatApi {
  constructor(private readonly rest: RestClient) {}

  me(): Promise<{ data: UserV2 }> {
    return this.rest.get("/developer/2/users/me");
  }

  fetchUser(id: Snowflake | string): Promise<{ data: UserV2 }> {
    return this.rest.get(`/developer/2/users/${encodeId(id)}`);
  }

  userByUsername(username: string): Promise<{ data: UserV2 }> {
    return this.rest.get(
      `/developer/2/users/by/username/${encodeId(username)}`,
    );
  }

  userTweets(
    id: Snowflake | string,
    query?: { max_results?: number; pagination_token?: string },
  ): Promise<{ data: TweetV2[]; meta?: TwitterCompatMeta }> {
    return this.rest.get(
      `/developer/2/users/${encodeId(id)}/tweets`,
      encodeQuery(query),
    );
  }

  homeTimeline(
    id: Snowflake | string,
    query?: { max_results?: number; pagination_token?: string },
  ): Promise<{ data: TweetV2[]; meta?: TwitterCompatMeta }> {
    return this.rest.get(
      `/developer/2/users/${encodeId(id)}/timelines/reverse_chronological`,
      encodeQuery(query),
    );
  }

  createTweet(input: { text: string }): Promise<{ data: TweetV2 }> {
    return this.rest.post("/developer/2/tweets", input);
  }

  fetchTweet(id: Snowflake | string): Promise<{ data: TweetV2 }> {
    return this.rest.get(`/developer/2/tweets/${encodeId(id)}`);
  }

  searchRecent(query: {
    query: string;
    max_results?: number;
    next_token?: string;
  }): Promise<{ data: TweetV2[]; meta?: TwitterCompatMeta }> {
    return this.rest.get("/developer/2/tweets/search/recent", encodeQuery(query));
  }

  deleteTweet(id: Snowflake | string): Promise<{ data: { deleted: boolean } }> {
    return this.rest.delete(`/developer/2/tweets/${encodeId(id)}`);
  }

  userFollowers(id: Snowflake | string): Promise<{ data: UserV2[] }> {
    return this.rest.get(`/developer/2/users/${encodeId(id)}/followers`);
  }

  userFollowing(id: Snowflake | string): Promise<{ data: UserV2[] }> {
    return this.rest.get(`/developer/2/users/${encodeId(id)}/following`);
  }

  follow(
    sourceUserId: Snowflake | string,
    body: { target_user_id: string },
  ): Promise<{ data: { following: boolean; pending_follow?: boolean } }> {
    return this.rest.post(
      `/developer/2/users/${encodeId(sourceUserId)}/following`,
      body,
    );
  }

  unfollow(
    sourceUserId: Snowflake | string,
    targetUserId: Snowflake | string,
  ): Promise<{ data: { following: boolean } }> {
    return this.rest.delete(
      `/developer/2/users/${encodeId(sourceUserId)}/following/${encodeId(targetUserId)}`,
    );
  }

  likingUsers(tweetId: Snowflake | string): Promise<{ data: UserV2[] }> {
    return this.rest.get(`/developer/2/tweets/${encodeId(tweetId)}/liking_users`);
  }

  retweetedBy(tweetId: Snowflake | string): Promise<{ data: UserV2[] }> {
    return this.rest.get(`/developer/2/tweets/${encodeId(tweetId)}/retweeted_by`);
  }

  quoteTweets(tweetId: Snowflake | string): Promise<{ data: TweetV2[] }> {
    return this.rest.get(`/developer/2/tweets/${encodeId(tweetId)}/quote_tweets`);
  }

  likedTweets(userId: Snowflake | string): Promise<{ data: TweetV2[] }> {
    return this.rest.get(`/developer/2/users/${encodeId(userId)}/liked_tweets`);
  }

  bookmarks(userId: Snowflake | string): Promise<{ data: TweetV2[] }> {
    return this.rest.get(`/developer/2/users/${encodeId(userId)}/bookmarks`);
  }

  like(
    userId: Snowflake | string,
    body: { tweet_id: string },
  ): Promise<{ data: { liked: boolean } }> {
    return this.rest.post(`/developer/2/users/${encodeId(userId)}/likes`, body);
  }

  unlike(
    userId: Snowflake | string,
    tweetId: Snowflake | string,
  ): Promise<{ data: { liked: boolean } }> {
    return this.rest.delete(
      `/developer/2/users/${encodeId(userId)}/likes/${encodeId(tweetId)}`,
    );
  }

  retweet(
    userId: Snowflake | string,
    body: { tweet_id: string },
  ): Promise<{ data: { retweeted: boolean } }> {
    return this.rest.post(
      `/developer/2/users/${encodeId(userId)}/retweets`,
      body,
    );
  }

  unretweet(
    userId: Snowflake | string,
    tweetId: Snowflake | string,
  ): Promise<{ data: { retweeted: boolean } }> {
    return this.rest.delete(
      `/developer/2/users/${encodeId(userId)}/retweets/${encodeId(tweetId)}`,
    );
  }

  block(
    userId: Snowflake | string,
    body: { target_user_id: string },
  ): Promise<{ data: { blocking: boolean } }> {
    return this.rest.post(
      `/developer/2/users/${encodeId(userId)}/blocking`,
      body,
    );
  }

  blocking(userId: Snowflake | string): Promise<{ data: UserV2[] }> {
    return this.rest.get(`/developer/2/users/${encodeId(userId)}/blocking`);
  }

  mute(
    userId: Snowflake | string,
    body: { target_user_id: string },
  ): Promise<{ data: { muting: boolean } }> {
    return this.rest.post(
      `/developer/2/users/${encodeId(userId)}/muting`,
      body,
    );
  }

  muting(userId: Snowflake | string): Promise<{ data: UserV2[] }> {
    return this.rest.get(`/developer/2/users/${encodeId(userId)}/muting`);
  }

  lists(): Promise<{ data: JsonObject[]; meta?: TwitterCompatMeta }> {
    return this.rest.get("/developer/2/lists");
  }

  spaces(): Promise<{ data: JsonObject[]; meta?: TwitterCompatMeta }> {
    return this.rest.get("/developer/2/spaces");
  }

  searchSpaces(query: { query?: string }): Promise<{ data: JsonObject[]; meta?: TwitterCompatMeta }> {
    return this.rest.get("/developer/2/spaces/search", encodeQuery(query));
  }
}
