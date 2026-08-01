import type { PageInfo, Snowflake } from "../util/types.js";
import type { Post } from "./Post.js";
import type { User } from "./User.js";

export interface Community {
  id: Snowflake;
  name: string;
  description?: string;
  joinType?: string;
  memberCount?: number;
  effectiveMinimumAge?: number | null;
  [extra: string]: unknown;
}

export interface CommunityMember {
  user?: User;
  userId?: Snowflake;
  role?: string;
  [extra: string]: unknown;
}

export interface CommunityReport {
  id: Snowflake;
  status?: string;
  [extra: string]: unknown;
}

export interface CommunityTimeline {
  community: Community;
  position?: number;
  [extra: string]: unknown;
}

export interface CommunityListResponse {
  communities: Community[];
  pagination?: PageInfo;
  [extra: string]: unknown;
}

export interface CommunityPostsResponse {
  posts: Post[];
  pagination?: PageInfo;
  [extra: string]: unknown;
}
