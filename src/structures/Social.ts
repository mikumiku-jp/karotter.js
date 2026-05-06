import type {
  IsoDate,
  JsonObject,
  PageInfo,
  Snowflake,
  Visibility,
} from "../util/types.js";
import type { User } from "./User.js";
import type { Post } from "./Post.js";

export interface Circle {
  id: Snowflake;
  name: string;
  ownerId: Snowflake;
  membersCount?: number;
  createdAt: IsoDate;
  members?: User[];
  [extra: string]: unknown;
}

export interface SocialList {
  id: Snowflake;
  name: string;
  description?: string | null;
  ownerId: Snowflake;
  isPublic?: boolean;
  membersCount?: number;
  postsCount?: number;
  createdAt: IsoDate;
  members?: User[];
  [extra: string]: unknown;
}

export interface Story {
  id: Snowflake;
  authorId: Snowflake;
  caption?: string | null;
  mediaUrl: string;
  mediaType: "image" | "video" | (string & {});
  textOverlay?: string | null;
  textOverlayStyle?: JsonObject | null;
  visibility?: Visibility;
  viewerCircleId?: Snowflake | null;
  minimumAge?: number | null;
  maximumAge?: number | null;
  isR18?: boolean;
  hideFromMinors?: boolean;
  expiresAt: IsoDate;
  createdAt: IsoDate;
  author?: User;
  viewersCount?: number;
  likesCount?: number;
  liked?: boolean;
  hasViewed?: boolean;
  [extra: string]: unknown;
}

export interface StoryComment {
  id: Snowflake;
  storyId: Snowflake;
  authorId: Snowflake;
  content: string;
  createdAt: IsoDate;
  author?: User;
}

export interface StoryViewer {
  userId: Snowflake;
  viewedAt?: IsoDate;
  user?: User;
  [extra: string]: unknown;
}

export interface AnonymousQuestion {
  id: Snowflake;
  recipientId: Snowflake;
  content: string;
  createdAt: IsoDate;
  answeredAt?: IsoDate | null;
  answer?: Post | null;
  [extra: string]: unknown;
}

export interface LinkPreview {
  url: string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  siteName?: string | null;
  [extra: string]: unknown;
}

export interface Hashtag {
  id: Snowflake;
  name: string;
  usageCount: number;
  trendScore: number;
  createdAt?: IsoDate;
  updatedAt?: IsoDate;
}

export interface TrendingTopic {
  token: string;
  label: string;
  type: string;
  postCount: number;
  authorCount: number;
  trendScore: number;
}

export type Paginated<T> = T & { pagination?: PageInfo };
