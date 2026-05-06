import type { RestClient } from "../RestClient.js";
import type {
  BookmarkFolder,
  ConversationInfo,
  CreatePostInput,
  Poll,
  PostAnalytics,
  Post,
  PostDraft,
  ReplyTargets,
  ScheduledPost,
  TimelineQuery,
} from "../../structures/Post.js";
import type { User } from "../../structures/User.js";
import type {
  MessageEnvelope,
  OffsetPagination,
  PageInfo,
  Pagination,
  ReplyRestriction,
  Snowflake,
  Visibility,
} from "../../util/types.js";
import { appendField, appendJson, appendMedia } from "../../util/form.js";
import { encodeId, encodeQuery } from "../utils.js";
import {
  iterateOffsetPages,
  type OffsetPaginationOptions,
} from "../../util/pagination.js";
import { ValidationError } from "../../util/errors.js";
import {
  assertArrayResponse,
  assertAtLeast,
  assertAtMost,
  assertNonEmptyText,
  assertPositiveInteger,
  assertValidDate,
} from "../../util/validation.js";

export interface PostResponse {
  message?: string;
  post: Post;
  scheduledPost?: ScheduledPost;
}

export interface PostListResponse {
  posts: Post[];
  pagination?: PageInfo;
}

const DEFAULT_POST_VISIBILITY: Visibility = "PUBLIC";
const DEFAULT_REPLY_RESTRICTION: ReplyRestriction = "EVERYONE";
const DEFAULT_POLL_DURATION_HOURS = 24;
const DEFAULT_POLL_IS_ANONYMOUS = true;

export interface BookmarkListQuery extends Pagination {
  folderId?: Snowflake | string;
}

export interface RecommendedQuery extends Pagination {
  mode?: "algorithm" | "latest" | "beta" | (string & {});
}

export interface FetchPostQuery {
  includeMutedOrBlocked?: boolean;
}

export interface ReplyListResponse {
  replies: Post[];
  pagination?: PageInfo;
}

export interface UserListResponse {
  users: User[];
  pagination?: PageInfo;
}

export interface QuoteListResponse {
  quotes: Post[];
  pagination?: PageInfo;
}

export class PostsApi {
  constructor(private readonly rest: RestClient) {}

  createText(
    content: string,
    input: Omit<CreatePostInput, "content" | "media" | "poll"> = {},
  ): Promise<PostResponse> {
    return this.create({ ...input, content });
  }

  createMedia(
    content: string,
    media: NonNullable<CreatePostInput["media"]>,
    input: Omit<CreatePostInput, "content" | "media"> = {},
    options?: { onUploadProgress?: (loaded: number, total?: number) => void },
  ): Promise<PostResponse> {
    return this.create({ ...input, content, media }, options);
  }

  createPoll(
    content: string,
    poll: NonNullable<CreatePostInput["poll"]>,
    input: Omit<CreatePostInput, "content" | "media" | "poll"> = {},
  ): Promise<PostResponse> {
    return this.create({ ...input, content, poll });
  }

  async create(
    input: CreatePostInput,
    options?: { onUploadProgress?: (loaded: number, total?: number) => void },
  ): Promise<PostResponse> {
    const form = buildPostForm(input, { requireBody: true });
    const requestOptions = options?.onUploadProgress
      ? {
          onUploadProgress: (event: { loaded: number; total?: number }) => {
            options.onUploadProgress?.(event.loaded, event.total);
          },
        }
      : undefined;
    return this.rest.post<PostResponse>("/posts", form, requestOptions);
  }

  async edit(
    id: Snowflake | string,
    input: CreatePostInput,
  ): Promise<PostResponse> {
    return this.rest.put<PostResponse>(
      `/posts/${encodeId(id)}`,
      buildPostForm(input),
    );
  }

  delete(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/posts/${encodeId(id)}`);
  }

  fetch(
    id: Snowflake | string,
    query?: FetchPostQuery,
  ): Promise<{ post: Post }> {
    return this.rest.get(`/posts/${encodeId(id)}`, encodeQuery(query));
  }

  replies(
    id: Snowflake | string,
    query?: Pagination,
  ): Promise<ReplyListResponse> {
    return this.rest
      .get<ReplyListResponse>(
        `/posts/${encodeId(id)}/replies`,
        encodeQuery(query),
      )
      .then((response) =>
        validateListResponse(response, "replies", "posts.replies"),
      );
  }

  quotes(
    id: Snowflake | string,
    query?: Pagination,
  ): Promise<QuoteListResponse> {
    return this.rest
      .get<QuoteListResponse>(
        `/posts/${encodeId(id)}/quotes`,
        encodeQuery(query),
      )
      .then((response) =>
        validateListResponse(response, "quotes", "posts.quotes"),
      );
  }

  likes(
    id: Snowflake | string,
    query?: Pagination,
  ): Promise<UserListResponse> {
    return this.rest
      .get<UserListResponse>(
        `/posts/${encodeId(id)}/likes`,
        encodeQuery(query),
      )
      .then((response) =>
        validateListResponse(response, "users", "posts.likes"),
      );
  }

  rekarots(
    id: Snowflake | string,
    query?: Pagination,
  ): Promise<UserListResponse> {
    return this.rest
      .get<UserListResponse>(
        `/posts/${encodeId(id)}/rekarots`,
        encodeQuery(query),
      )
      .then((response) =>
        validateListResponse(response, "users", "posts.rekarots"),
      );
  }

  conversation(id: Snowflake | string): Promise<ConversationInfo> {
    return this.rest.get(`/posts/${encodeId(id)}/conversation`);
  }

  leaveConversation(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/posts/${encodeId(id)}/conversation/leave`);
  }

  replyTargets(id: Snowflake | string): Promise<ReplyTargets> {
    return this.rest.get(`/posts/${encodeId(id)}/reply-targets`);
  }

  analytics(id: Snowflake | string): Promise<PostAnalytics> {
    return this.rest.get(`/posts/${encodeId(id)}/analytics`);
  }

  timeline(query?: TimelineQuery): Promise<PostListResponse> {
    return this.rest
      .get<PostListResponse>("/posts/timeline", encodeQuery(query))
      .then((response) =>
        validateListResponse(response, "posts", "posts.timeline"),
      );
  }

  iterTimeline(
    query: TimelineQuery = {},
    options: OffsetPaginationOptions = {},
  ): AsyncGenerator<Post> {
    return iterateOffsetPages(
      (pageQuery) => this.timeline(pageQuery),
      (response) => response.posts,
      query,
      options,
    );
  }

  trending(): Promise<PostListResponse> {
    return this.rest.get("/posts/trending");
  }

  recommended(query?: RecommendedQuery): Promise<PostListResponse> {
    return this.rest
      .get<PostListResponse>("/posts/recommended", encodeQuery(query))
      .then((response) =>
        validateListResponse(response, "posts", "posts.recommended"),
      );
  }

  bookmarks(query?: BookmarkListQuery): Promise<PostListResponse> {
    return this.rest
      .get<PostListResponse>("/posts/me/bookmarks", encodeQuery(query))
      .then((response) =>
        validateListResponse(response, "posts", "posts.bookmarks"),
      );
  }

  iterBookmarks(
    query: OffsetPagination = {},
    options: OffsetPaginationOptions = {},
  ): AsyncGenerator<Post> {
    return iterateOffsetPages(
      (pageQuery) => this.bookmarks(pageQuery),
      (response) => response.posts,
      query,
      options,
    );
  }

  scheduled(): Promise<{ scheduledPosts: ScheduledPost[] }> {
    return this.rest.get("/posts/scheduled/me");
  }

  cancelScheduled(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/posts/scheduled/${encodeId(id)}`);
  }

  like(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/posts/${encodeId(id)}/like`);
  }

  unlike(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/posts/${encodeId(id)}/like`);
  }

  rekarot(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/posts/${encodeId(id)}/rekarot`);
  }

  unrekarot(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/posts/${encodeId(id)}/rekarot`);
  }

  bookmark(
    id: Snowflake | string,
    folderIds?: Array<Snowflake | string>,
  ): Promise<MessageEnvelope> {
    if (folderIds && folderIds.length > 0) {
      return this.rest.post(`/posts/${encodeId(id)}/bookmark`, {
        folderIds: folderIds.map((value) => Number(value)),
      });
    }
    return this.rest.post(`/posts/${encodeId(id)}/bookmark`);
  }

  unbookmark(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/posts/${encodeId(id)}/bookmark`);
  }

  setBookmarkFolders(
    id: Snowflake | string,
    folderIds: Array<Snowflake | string>,
  ): Promise<MessageEnvelope> {
    return this.rest.put(`/posts/${encodeId(id)}/bookmark-folders`, {
      folderIds: folderIds.map((value) => Number(value)),
    });
  }

  react(id: Snowflake | string, emoji: string): Promise<MessageEnvelope> {
    return this.rest.post(`/posts/${encodeId(id)}/react`, { emoji });
  }

  unreact(id: Snowflake | string, emoji: string): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/posts/${encodeId(id)}/react/${encodeURIComponent(emoji)}`,
    );
  }

  reactionUsers(
    id: Snowflake | string,
    emoji: string,
    query?: Pagination,
  ): Promise<UserListResponse> {
    return this.rest.get(
      `/posts/${encodeId(id)}/react/${encodeURIComponent(emoji)}/users`,
      encodeQuery(query),
    );
  }

  votePoll(
    id: Snowflake | string,
    optionId: Snowflake,
  ): Promise<MessageEnvelope & { poll?: Poll }> {
    return this.rest.post(`/posts/${encodeId(id)}/poll/vote`, { optionId });
  }

  pollVoters(
    postId: Snowflake | string,
    optionId: Snowflake | string,
    query?: Pagination,
  ): Promise<UserListResponse> {
    return this.rest.get(
      `/posts/${encodeId(postId)}/poll/options/${encodeId(optionId)}/voters`,
      encodeQuery(query),
    );
  }

  reportViews(postIds: Array<Snowflake | string>): Promise<{ recorded: number }> {
    return this.rest.post("/posts/batch-views", {
      postIds: postIds.map((id) => Number(id)),
    });
  }

  submitBetaSurvey(
    preference: "beta" | "current",
    variant?: string,
  ): Promise<MessageEnvelope> {
    return this.rest.post("/posts/feedback/beta-survey", {
      preference,
      variant,
    });
  }

  bookmarkFolders(): Promise<{ folders: BookmarkFolder[] }> {
    return this.rest.get("/posts/me/bookmark-folders");
  }

  createBookmarkFolder(name: string): Promise<{ folder: BookmarkFolder }> {
    return this.rest.post("/posts/me/bookmark-folders", { name });
  }

  deleteBookmarkFolder(folderId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/posts/me/bookmark-folders/${encodeId(folderId)}`);
  }

  updateBookmarkFolder(
    folderId: Snowflake | string,
    body: { name?: string },
  ): Promise<{ folder: BookmarkFolder }> {
    return this.rest.patch(
      `/posts/me/bookmark-folders/${encodeId(folderId)}`,
      body,
    );
  }

  drafts(): Promise<{ drafts: PostDraft[] }> {
    return this.rest.get("/posts/drafts");
  }

  async createDraft(input: CreatePostInput): Promise<{ draft: PostDraft }> {
    return this.rest.post("/posts/drafts", buildPostForm(input));
  }

  async updateDraft(
    draftId: Snowflake | string,
    input: CreatePostInput,
  ): Promise<{ draft: PostDraft }> {
    return this.rest.put(
      `/posts/drafts/${encodeId(draftId)}`,
      buildPostForm(input),
    );
  }

  deleteDraft(draftId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/posts/drafts/${encodeId(draftId)}`);
  }
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
    const iso =
      input.scheduledFor instanceof Date
        ? input.scheduledFor.toISOString()
        : input.scheduledFor;
    appendField(form, "scheduledFor", iso);
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
  appendJson(form, "mediaAlts", media.map((m) => m.alt ?? ""));
  appendJson(form, "mediaSpoilerFlags", media.map((m) => Boolean(m.spoiler)));
  appendJson(form, "mediaR18Flags", media.map((m) => Boolean(m.r18)));
  return form;
}

function validatePostInput(
  input: CreatePostInput,
  options: { requireBody?: boolean } = {},
): void {
  const hasContent =
    input.content !== undefined && input.content.trim().length > 0;
  const mediaCount = input.media?.length ?? 0;
  const hasPoll = input.poll !== undefined;

  if (
    options.requireBody === true &&
    !hasContent &&
    mediaCount === 0 &&
    !hasPoll
  ) {
    throwValidation("post must contain content, media, or poll");
  }
  if (input.content !== undefined) assertNonEmptyText(input.content, "content");
  if (input.media !== undefined) assertAtMost(mediaCount, 4, "media");
  if (input.minimumAge !== null && input.minimumAge !== undefined) {
    assertPositiveInteger(input.minimumAge, "minimumAge");
  }
  if (input.maximumAge !== null && input.maximumAge !== undefined) {
    assertPositiveInteger(input.maximumAge, "maximumAge");
  }
  if (
    input.minimumAge !== null &&
    input.minimumAge !== undefined &&
    input.maximumAge !== null &&
    input.maximumAge !== undefined &&
    input.minimumAge > input.maximumAge
  ) {
    throwValidation("minimumAge must be less than or equal to maximumAge");
  }
  if (input.visibility === "CIRCLE" && input.viewerCircleId === undefined) {
    throwValidation("viewerCircleId is required when visibility is CIRCLE");
  }
  if (input.replyRestriction === "CIRCLE" && input.replyCircleId === undefined) {
    throwValidation("replyCircleId is required when replyRestriction is CIRCLE");
  }
  if (input.scheduledFor !== undefined) {
    assertValidDate(input.scheduledFor, "scheduledFor");
  }
  if (input.poll !== undefined) {
    assertAtLeast(input.poll.options.length, 2, "poll.options");
    for (const option of input.poll.options) {
      assertNonEmptyText(option, "poll.options[]");
    }
    if (input.poll.durationHours !== undefined) {
      assertPositiveInteger(input.poll.durationHours, "poll.durationHours");
    }
  }
}

function validateListResponse<T>(
  response: T,
  key: string,
  context: string,
): T {
  assertArrayResponse(response, key, context);
  return response;
}

function throwValidation(message: string): never {
  throw new ValidationError(message, { code: "VALIDATION_FAILED" });
}
