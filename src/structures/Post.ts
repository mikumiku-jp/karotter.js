import type {
  IsoDate,
  ReplyRestriction,
  Snowflake,
  Visibility,
} from "../util/types.js";
import type { MediaInput } from "../util/form.js";
import type { User } from "./User.js";

export type MediaType = "image" | "video" | (string & {});

export interface PollOption {
  id: Snowflake;
  text: string;
  imageUrl?: string | null;
  votes: number;
  voted?: boolean;
}

export interface Poll {
  id: Snowflake;
  options: PollOption[];
  totalVotes: number;
  endsAt?: IsoDate | null;
  isAnonymous?: boolean;
  closed?: boolean;
}

export interface ReactionEntry {
  emoji: string;
  userId: Snowflake;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  reacted?: boolean;
}

export interface MentionEntry {
  id: Snowflake;
  username: string;
}

export interface HashtagEntry {
  id: Snowflake;
  name: string;
}

export interface Post {
  id: Snowflake;
  content: string;
  authorId: Snowflake;
  parentId: Snowflake | null;
  quotedPostId: Snowflake | null;
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
  createdAt: IsoDate;
  editedAt?: IsoDate | null;
  [extra: string]: unknown;
}

export interface ScheduledPost {
  id: Snowflake;
  scheduledFor: IsoDate;
  content: string;
  [extra: string]: unknown;
}

export interface PostDraft {
  id: Snowflake;
  content?: string;
  mediaUrls?: string[];
  poll?: Poll | null;
  scheduledFor?: IsoDate | null;
  createdAt?: IsoDate;
  updatedAt?: IsoDate;
  [extra: string]: unknown;
}

export interface MediaAttachment {
  file: MediaInput;
  alt?: string;
  spoiler?: boolean;
  r18?: boolean;
}

export interface PollOptionImage {
  index: number;
  file: MediaInput;
}

export interface PollDraft {
  options: string[];
  durationHours?: number;
  isAnonymous?: boolean;
  optionImages?: PollOptionImage[];
}

export interface CreatePostInput {
  content?: string;
  parentId?: Snowflake | string;
  quotedPostId?: Snowflake | string;
  questionId?: Snowflake | string;
  excludedMentions?: Snowflake[];
  isAiGenerated?: boolean;
  isPromotional?: boolean;
  isR18?: boolean;
  hideFromMinors?: boolean;
  minimumAge?: number | null;
  maximumAge?: number | null;
  visibility?: Visibility;
  viewerCircleId?: Snowflake | string;
  replyRestriction?: ReplyRestriction;
  replyCircleId?: Snowflake | string;
  scheduledFor?: Date | IsoDate;
  poll?: PollDraft;
  media?: MediaAttachment[];
}

export interface PostAnalytics {
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

export interface BookmarkFolder {
  id: Snowflake;
  name: string;
  createdAt: IsoDate;
  postsCount?: number;
  [extra: string]: unknown;
}

export type TimelineMode = "latest" | "trending" | "following";

export interface TimelineQuery {
  page?: number;
  limit?: number;
  mode?: TimelineMode;
}

export interface ConversationInfo {
  rootPostId: Snowflake;
  isParticipant: boolean;
  hasLeftConversation: boolean;
  participants: User[];
}

export interface ReplyTargets {
  rootPostId: Snowflake;
  selectedUserIds: Snowflake[];
  excludedUserIds: Snowflake[];
  candidates: User[];
}
