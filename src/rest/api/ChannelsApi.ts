import type { RestClient } from "../RestClient.js";
import type {
  GuildChannel,
  GuildForumPost,
  GuildMessage,
  GuildStage,
} from "../../structures/Guild.js";
import type {
  JsonObject,
  MessageEnvelope,
  Pagination,
  Snowflake,
} from "../../util/types.js";
import { encodeId, encodeQuery } from "../utils.js";

export type GuildMessageForm = JsonObject | FormData;

export class ChannelsApi {
  constructor(private readonly rest: RestClient) {}

  update(
    channelId: Snowflake | string,
    input: JsonObject,
  ): Promise<{ channel: GuildChannel }> {
    return this.rest.patch(`/channels/${encodeId(channelId)}`, input);
  }

  delete(channelId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/channels/${encodeId(channelId)}`);
  }

  setPermission(
    channelId: Snowflake | string,
    targetId: Snowflake | string,
    permission: string,
    input: JsonObject,
  ): Promise<MessageEnvelope> {
    return this.rest.put(
      `/channels/${encodeId(channelId)}/permissions/${encodeId(targetId)}/${encodeURIComponent(permission)}`,
      input,
    );
  }

  joinVoice(channelId: Snowflake | string): Promise<JsonObject> {
    return this.rest.post(`/channels/${encodeId(channelId)}/voice/join`);
  }

  leaveVoice(channelId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/channels/${encodeId(channelId)}/voice/leave`);
  }


  createStage(
    channelId: Snowflake | string,
    input: JsonObject,
  ): Promise<{ stage: GuildStage }> {
    return this.rest.post(`/channels/${encodeId(channelId)}/stage`, input);
  }

  updateStage(
    channelId: Snowflake | string,
    input: JsonObject,
  ): Promise<{ stage: GuildStage }> {
    return this.rest.patch(`/channels/${encodeId(channelId)}/stage`, input);
  }

  deleteStage(channelId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/channels/${encodeId(channelId)}/stage`);
  }

  updateMyStageState(
    channelId: Snowflake | string,
    input: JsonObject,
  ): Promise<MessageEnvelope> {
    return this.rest.patch(`/channels/${encodeId(channelId)}/stage/me`, input);
  }

  updateStageParticipant(
    channelId: Snowflake | string,
    userId: Snowflake | string,
    input: JsonObject,
  ): Promise<MessageEnvelope> {
    return this.rest.patch(
      `/channels/${encodeId(channelId)}/stage/participants/${encodeId(userId)}`,
      input,
    );
  }

  forumPosts(
    channelId: Snowflake | string,
    query?: Pagination,
  ): Promise<{ posts: GuildForumPost[] }> {
    return this.rest.get(
      `/channels/${encodeId(channelId)}/forum-posts`,
      encodeQuery(query),
    );
  }

  createForumPost(
    channelId: Snowflake | string,
    input: GuildMessageForm,
  ): Promise<{ post: GuildForumPost }> {
    return this.rest.post(
      `/channels/${encodeId(channelId)}/forum-posts`,
      input,
    );
  }

  fetchForumPost(
    channelId: Snowflake | string,
    postId: Snowflake | string,
  ): Promise<{ post: GuildForumPost }> {
    return this.rest.get(
      `/channels/${encodeId(channelId)}/forum-posts/${encodeId(postId)}`,
    );
  }

  replyToForumPost(
    channelId: Snowflake | string,
    postId: Snowflake | string,
    input: GuildMessageForm,
  ): Promise<{ message: GuildMessage }> {
    return this.rest.post(
      `/channels/${encodeId(channelId)}/forum-posts/${encodeId(postId)}/replies`,
      input,
    );
  }

  messages(
    channelId: Snowflake | string,
    query?: Pagination,
  ): Promise<{ messages: GuildMessage[] }> {
    return this.rest.get(
      `/channels/${encodeId(channelId)}/messages`,
      encodeQuery(query),
    );
  }

  sendMessage(
    channelId: Snowflake | string,
    input: GuildMessageForm,
  ): Promise<{ message: GuildMessage }> {
    return this.rest.post(`/channels/${encodeId(channelId)}/messages`, input);
  }

  updateMessage(
    messageId: Snowflake | string,
    input: JsonObject,
  ): Promise<{ message: GuildMessage }> {
    return this.rest.patch(`/channels/messages/${encodeId(messageId)}`, input);
  }

  deleteMessage(messageId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/channels/messages/${encodeId(messageId)}`);
  }

  reactToMessage(
    messageId: Snowflake | string,
    reaction: string,
  ): Promise<MessageEnvelope> {
    return this.rest.post(`/channels/messages/${encodeId(messageId)}/reactions`, {
      reaction,
    });
  }
}
