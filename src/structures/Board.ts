import type { IsoDate, Snowflake } from "../util/types.js";
import type { User } from "./User.js";
import type { ReactionSummary } from "./Post.js";

export interface Board {
  id: Snowflake;
  slug: string;
  name: string;
  description?: string | null;
  followersCount?: number;
  threadsCount?: number;
  createdAt: IsoDate;
  followed?: boolean;
  [extra: string]: unknown;
}

export interface BoardThread {
  id: Snowflake;
  boardSlug: string;
  authorId: Snowflake;
  title: string;
  content: string;
  imageUrls?: string[];
  repliesCount?: number;
  reactionsCount?: number;
  createdAt: IsoDate;
  updatedAt?: IsoDate;
  author?: User;
  followed?: boolean;
  reactionSummary?: ReactionSummary[];
  [extra: string]: unknown;
}

export interface BoardReply {
  id: Snowflake;
  threadId: Snowflake;
  authorId: Snowflake;
  content: string;
  imageUrls?: string[];
  createdAt: IsoDate;
  author?: User;
  reactionSummary?: ReactionSummary[];
}
