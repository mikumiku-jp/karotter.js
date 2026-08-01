import type { RestClient } from "../RestClient.js";
import type {
  Hashtag,
  TrendingTopic,
} from "../../structures/Social.js";
import type { Post } from "../../structures/Post.js";
import type { User } from "../../structures/User.js";
import type { CommunityListResponse } from "../../structures/Community.js";
import type { CursorPagination, PageInfo } from "../../util/types.js";
import { encodeQuery } from "../utils.js";

export interface SearchQuery {
  q: string;
  page?: number;
  limit?: number;
  cursor?: string | number;
  compact?: boolean | "1";
}

export interface PostSearchQuery extends SearchQuery {
  type?: "latest" | "media" | "topics";
}

export interface UnifiedSearchResult {
  users: User[];
  posts: Post[];
  hashtags: Hashtag[];
  pagination?: PageInfo;
}

export class SearchApi {
  constructor(private readonly rest: RestClient) {}

  unified(query: SearchQuery): Promise<UnifiedSearchResult> {
    return this.rest.get("/search", encodeQuery(query));
  }

  users(query: SearchQuery): Promise<{ users: User[]; pagination?: PageInfo }> {
    return this.rest.get("/search/users", encodeQuery(query));
  }

  communities(query: SearchQuery): Promise<CommunityListResponse> {
    return this.rest.get("/search/communities", encodeQuery(query));
  }

  posts(
    query: PostSearchQuery,
  ): Promise<{ posts: Post[]; pagination?: PageInfo }> {
    return this.rest.get("/search/posts", encodeQuery(query));
  }

  hashtags(
    query: SearchQuery,
  ): Promise<{ hashtags: Hashtag[]; pagination?: PageInfo }> {
    return this.rest.get("/search/hashtags", encodeQuery(query));
  }

  trendingTopics(limit = 5): Promise<{ trends: TrendingTopic[] }> {
    return this.rest.get("/search/trending/topics", { params: { limit } });
  }

  trendingHashtags(limit = 5): Promise<{ hashtags: Hashtag[] }> {
    return this.rest.get("/search/trending/hashtags", { params: { limit } });
  }

  discoverLatest(query?: CursorPagination): Promise<{ posts: Post[] }> {
    return this.rest.get("/search/discover/latest", encodeQuery(query));
  }

  discoverMedia(query?: CursorPagination): Promise<{ posts: Post[] }> {
    return this.rest.get("/search/discover/media", encodeQuery(query));
  }

  discoverTopics(query?: CursorPagination): Promise<{ posts: Post[] }> {
    return this.rest.get("/search/discover/topics", encodeQuery(query));
  }
}
