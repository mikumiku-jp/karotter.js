import type { RestClient } from "../RestClient.js";
import type {
  ActiveCall,
  DmFile,
  DmGroup,
  DmGroupSettings,
  DmMessage,
  SendDmInput,
} from "../../structures/Dm.js";
import type {
  CursorPagination,
  MessageEnvelope,
  Pagination,
  Snowflake,
  JsonObject,
} from "../../util/types.js";
import { appendField, appendJson, appendMedia } from "../../util/form.js";
import { encodeId, encodeQuery } from "../utils.js";
import type { PageInfo } from "../../util/types.js";
import {
  iterateCursorPages,
  type CursorPaginationOptions,
} from "../../util/pagination.js";
import { ValidationError } from "../../util/errors.js";
import {
  assertArrayResponse,
  assertAtLeast,
  assertNonEmptyText,
  assertPositiveInteger,
} from "../../util/validation.js";

export type DmRequestAction = "accept" | "reject";

export interface DmGroupsResponse {
  groups: DmGroup[];
  pagination?: PageInfo;
}

export interface DmMessagesResponse {
  messages: DmMessage[];
  pagination?: PageInfo;
}

export interface DmUnreadCount {
  count?: number;
  unreadCount?: number;
  [extra: string]: unknown;
}

export class DmApi {
  constructor(private readonly rest: RestClient) {}

  groups(query?: Pagination): Promise<DmGroupsResponse> {
    return this.rest
      .get<DmGroupsResponse>("/dm/groups", encodeQuery(query))
      .then((response) => validateListResponse(response, "groups", "dm.groups"));
  }

  unreadCount(): Promise<DmUnreadCount> {
    return this.rest.get("/dm/unread/count");
  }

  createGroup(userIds: Array<Snowflake | string>): Promise<{ group: DmGroup }> {
    return this.rest.post("/dm/groups", {
      userIds: userIds.map((id) => Number(id)),
    });
  }

  startDirect(targetUserId: Snowflake | string): Promise<{ group: DmGroup }> {
    return this.rest.post("/dm/start", { targetUserId: Number(targetUserId) });
  }

  messages(
    groupId: Snowflake | string,
    query?: Pagination,
  ): Promise<DmMessagesResponse> {
    return this.rest
      .get<DmMessagesResponse>(
        `/dm/groups/${encodeId(groupId)}/messages`,
        encodeQuery(query),
      )
      .then((response) =>
        validateListResponse(response, "messages", "dm.messages"),
      );
  }

  iterMessages(
    groupId: Snowflake | string,
    query: CursorPagination = {},
    options: CursorPaginationOptions = {},
  ): AsyncGenerator<DmMessage> {
    return iterateCursorPages(
      (pageQuery) => this.messages(groupId, pageQuery),
      (response) => response.messages,
      query,
      options,
    );
  }

  sendText(
    groupId: Snowflake | string,
    content: string,
    input: Omit<SendDmInput, "content" | "attachments" | "poll"> = {},
  ): Promise<{ message: DmMessage }> {
    return this.send(groupId, { ...input, content });
  }

  sendPoll(
    groupId: Snowflake | string,
    poll: NonNullable<SendDmInput["poll"]>,
    input: Omit<SendDmInput, "content" | "attachments" | "poll"> = {},
  ): Promise<{ message: DmMessage }> {
    return this.send(groupId, { ...input, poll });
  }

  async send(
    groupId: Snowflake | string,
    input: SendDmInput,
  ): Promise<{ message: DmMessage }> {
    const form = buildDmForm(input);
    return this.rest.post(`/dm/groups/${encodeId(groupId)}/messages`, form);
  }

  markRead(groupId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/groups/${encodeId(groupId)}/read`);
  }

  leaveGroup(groupId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/groups/${encodeId(groupId)}/leave`);
  }

  clearHistory(groupId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/groups/${encodeId(groupId)}/clear`);
  }

  addMembers(
    groupId: Snowflake | string,
    userIds: Array<Snowflake | string>,
  ): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/groups/${encodeId(groupId)}/members`, {
      userIds: userIds.map((id) => Number(id)),
    });
  }

  addMember(
    groupId: Snowflake | string,
    userId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/groups/${encodeId(groupId)}/members`, {
      userId: Number(userId),
    });
  }

  removeMember(
    groupId: Snowflake | string,
    userId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/dm/groups/${encodeId(groupId)}/members/${encodeId(userId)}`,
    );
  }

  respondToRequest(
    groupId: Snowflake | string,
    action: DmRequestAction,
  ): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/groups/${encodeId(groupId)}/request/${action}`);
  }

  acceptRequest(groupId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/groups/${encodeId(groupId)}/request/accept`);
  }

  rejectRequest(groupId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/groups/${encodeId(groupId)}/request/reject`);
  }

  call(groupId: Snowflake | string): Promise<{ call: ActiveCall | null }> {
    return this.rest.get(`/dm/groups/${encodeId(groupId)}/call`);
  }

  startCall(
    groupId: Snowflake | string,
    body?: JsonObject,
  ): Promise<{ call: ActiveCall }> {
    return this.rest.post(`/dm/groups/${encodeId(groupId)}/call/start`, body);
  }

  joinCall(
    groupId: Snowflake | string,
    body?: JsonObject,
  ): Promise<{ call: ActiveCall }> {
    return this.rest.post(`/dm/groups/${encodeId(groupId)}/call/join`, body);
  }

  leaveCall(
    groupId: Snowflake | string,
    body?: JsonObject,
  ): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/groups/${encodeId(groupId)}/call/leave`, body);
  }

  editMessage(
    messageId: Snowflake | string,
    content: string,
  ): Promise<{ message: DmMessage }> {
    return this.rest.patch(`/dm/messages/${encodeId(messageId)}`, { content });
  }

  deleteMessage(messageId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/dm/messages/${encodeId(messageId)}`);
  }

  reactToMessage(
    messageId: Snowflake | string,
    emoji: string,
  ): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/messages/${encodeId(messageId)}/reactions`, {
      emoji,
    });
  }

  votePoll(
    messageId: Snowflake | string,
    optionId: Snowflake,
  ): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/messages/${encodeId(messageId)}/poll/vote`, {
      optionId,
    });
  }

  fetchGroup(groupId: Snowflake | string): Promise<{ group: DmGroup }> {
    return this.rest.get(`/dm/groups/${encodeId(groupId)}`);
  }

  deleteGroup(groupId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/dm/groups/${encodeId(groupId)}`);
  }

  updateGroup(
    groupId: Snowflake | string,
    body: Partial<Pick<DmGroup, "name">> & {
      memberIds?: Array<Snowflake | string>;
    },
  ): Promise<{ group: DmGroup }> {
    return this.rest.patch(`/dm/groups/${encodeId(groupId)}`, body);
  }

  groupInfo(groupId: Snowflake | string): Promise<{ group: DmGroup }> {
    return this.rest.get(`/dm/groups/${encodeId(groupId)}/info`);
  }

  groupSettings(groupId: Snowflake | string): Promise<DmGroupSettings> {
    return this.rest.get(`/dm/groups/${encodeId(groupId)}/settings`);
  }

  updateGroupSettings(
    groupId: Snowflake | string,
    body: DmGroupSettings,
  ): Promise<DmGroupSettings> {
    return this.rest.patch(`/dm/groups/${encodeId(groupId)}/settings`, body);
  }

  mySettings(): Promise<DmGroupSettings> {
    return this.rest.get("/dm/me/settings");
  }

  startTyping(groupId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/groups/${encodeId(groupId)}/typing`);
  }

  stopTyping(groupId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/groups/${encodeId(groupId)}/typing/stop`);
  }

  files(groupId: Snowflake | string): Promise<{ files: DmFile[] }> {
    return this.rest.get(`/dm/groups/${encodeId(groupId)}/files`);
  }

  media(groupId: Snowflake | string): Promise<{ media: DmFile[] }> {
    return this.rest.get(`/dm/groups/${encodeId(groupId)}/media`);
  }

  pinMessage(
    groupId: Snowflake | string,
    messageId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/groups/${encodeId(groupId)}/pin`, { messageId });
  }

  pinnedMessages(
    groupId: Snowflake | string,
  ): Promise<{ messages: DmMessage[] }> {
    return this.rest.get(`/dm/groups/${encodeId(groupId)}/pinned`);
  }

  pinMessageById(messageId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/messages/${encodeId(messageId)}/pin`);
  }

  unpinMessageById(messageId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/dm/messages/${encodeId(messageId)}/pin`);
  }

  reportMessage(
    messageId: Snowflake | string,
    body: { reason: string; description?: string },
  ): Promise<MessageEnvelope> {
    return this.rest.post(`/dm/messages/${encodeId(messageId)}/report`, body);
  }

  translateMessage(
    messageId: Snowflake | string,
    body: { targetLanguage: string },
  ): Promise<{ translation: string; sourceLanguage?: string }> {
    return this.rest.post(`/dm/messages/${encodeId(messageId)}/translate`, body);
  }

  removeReaction(
    messageId: Snowflake | string,
    emoji?: string,
  ): Promise<MessageEnvelope> {
    if (emoji !== undefined) {
      return this.rest.delete(
        `/dm/messages/${encodeId(messageId)}/reactions/${encodeId(emoji)}`,
      );
    }
    return this.rest.delete(`/dm/messages/${encodeId(messageId)}/reactions`);
  }

  activeCalls(): Promise<{ calls: ActiveCall[] }> {
    return this.rest.get("/dm/calls/active");
  }

  myCalls(): Promise<{ calls: ActiveCall[] }> {
    return this.rest.get("/dm/me/calls");
  }

  streamUrl(): string {
    return `${this.rest.baseUrl}/api/dm/stream`;
  }

  groupStreamUrl(groupId: Snowflake | string): string {
    return `${this.rest.baseUrl}/api/dm/groups/${encodeId(groupId)}/stream`;
  }

  messagesStreamUrl(): string {
    return `${this.rest.baseUrl}/api/dm/messages/stream`;
  }
}

function buildDmForm(input: SendDmInput): FormData {
  validateDmInput(input);
  const form = new FormData();
  if (input.content !== undefined) form.append("content", input.content);
  if (input.replyToId !== undefined)
    appendField(form, "replyToId", String(input.replyToId));
  if (input.poll) {
    appendJson(form, "pollOptions", input.poll.options);
    if (typeof input.poll.durationHours === "number") {
      appendField(form, "pollDurationHours", String(input.poll.durationHours));
    }
  }
  const attachments = input.attachments ?? [];
  for (const item of attachments) appendMedia(form, "attachments", item.file);
  if (attachments.length > 0) {
    appendJson(
      form,
      "attachmentAlts",
      attachments.map((a) => a.alt ?? ""),
    );
    appendJson(
      form,
      "attachmentSpoilerFlags",
      attachments.map((a) => Boolean(a.spoiler)),
    );
    appendJson(
      form,
      "attachmentR18Flags",
      attachments.map((a) => Boolean(a.r18)),
    );
  }
  return form;
}

function validateDmInput(input: SendDmInput): void {
  const hasContent =
    input.content !== undefined && input.content.trim().length > 0;
  const attachmentCount = input.attachments?.length ?? 0;
  const hasPoll = input.poll !== undefined;

  if (!hasContent && attachmentCount === 0 && !hasPoll) {
    throw new ValidationError(
      "dm message must contain content, attachments, or poll",
      { code: "VALIDATION_FAILED" },
    );
  }
  if (input.content !== undefined) assertNonEmptyText(input.content, "content");
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
