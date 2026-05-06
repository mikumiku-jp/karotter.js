import type { RestClient } from "../RestClient.js";
import type { ApiKey } from "../../structures/Auth.js";
import type { Post } from "../../structures/Post.js";
import type { Hashtag } from "../../structures/Social.js";
import type { User } from "../../structures/User.js";
import type {
  JsonObject,
  MessageEnvelope,
  PageInfo,
  Pagination,
  Snowflake,
} from "../../util/types.js";
import { encodeId, encodeQuery } from "../utils.js";

export type DeveloperSearchType = "posts" | "users" | "hashtags";

export interface DeveloperSearchQuery {
  q: string;
  type?: DeveloperSearchType;
  limit?: number;
  cursor?: string;
}

export interface DeveloperSearchResult {
  type: DeveloperSearchType;
  results: Array<Post | User | Hashtag>;
  pagination?: PageInfo;
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

  posts(query?: Pagination): Promise<{ posts: Post[]; pagination?: PageInfo }> {
    return this.rest.get("/developer/posts", encodeQuery(query));
  }

  fetchPost(id: Snowflake | string): Promise<{ post: Post }> {
    return this.rest.get(`/developer/posts/${encodeId(id)}`);
  }

  postReplies(
    id: Snowflake | string,
    query?: Pagination,
  ): Promise<{ replies: Post[]; pagination?: PageInfo }> {
    return this.rest.get(
      `/developer/posts/${encodeId(id)}/replies`,
      encodeQuery(query),
    );
  }

  postQuotes(
    id: Snowflake | string,
    query?: Pagination,
  ): Promise<{ quotes: Post[]; pagination?: PageInfo }> {
    return this.rest.get(
      `/developer/posts/${encodeId(id)}/quotes`,
      encodeQuery(query),
    );
  }

  createPost(input: { content: string }): Promise<{ post: Post }> {
    return this.rest.post("/developer/posts", input);
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

  rekarot(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/developer/posts/${encodeId(id)}/rekarot`);
  }

  unrekarot(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/developer/posts/${encodeId(id)}/rekarot`);
  }

  timeline(query?: {
    limit?: number;
    mode?: "latest" | "trending" | "following";
  }): Promise<{ posts: Post[]; pagination?: PageInfo }> {
    return this.rest.get("/developer/timeline", encodeQuery(query));
  }

  search(query: DeveloperSearchQuery): Promise<DeveloperSearchResult> {
    return this.rest.get("/developer/search", encodeQuery(query));
  }

  fetchUser(id: Snowflake | string): Promise<{ user: User }> {
    return this.rest.get(`/developer/users/${encodeId(id)}`);
  }

  userFollowers(id: Snowflake | string): Promise<{ users: User[] }> {
    return this.rest.get(`/developer/users/${encodeId(id)}/followers`);
  }

  userFollowing(id: Snowflake | string): Promise<{ users: User[] }> {
    return this.rest.get(`/developer/users/${encodeId(id)}/following`);
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

  bookmarks(query?: Pagination): Promise<{ posts: Post[]; pagination?: PageInfo }> {
    return this.rest.get("/developer/bookmarks", encodeQuery(query));
  }

  me(): Promise<{ user: User }> {
    return this.rest.get("/developer/me");
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
