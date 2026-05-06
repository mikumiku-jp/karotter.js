import type { IsoDate, LiteralUnion, Snowflake } from "../util/types.js";
import type { User } from "./User.js";

export type NewsStatus = LiteralUnion<
  "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED"
>;

export interface NewsArticle {
  id: Snowflake;
  slug: string;
  title: string;
  body: string;
  status: NewsStatus;
  authorId: Snowflake;
  publishedAt?: IsoDate | null;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  author?: User;
  likesCount?: number;
  commentsCount?: number;
  liked?: boolean;
  coverImageUrl?: string | null;
  [extra: string]: unknown;
}

export interface NewsArticleInput {
  title: string;
  body: string;
  category?: string;
  summary?: string;
  slug?: string;
  coverImageUrl?: string | null;
  status?: NewsStatus;
}

export interface NewsComment {
  id: Snowflake;
  articleId: Snowflake;
  authorId: Snowflake;
  content: string;
  createdAt: IsoDate;
  updatedAt?: IsoDate | null;
  author?: User;
}
