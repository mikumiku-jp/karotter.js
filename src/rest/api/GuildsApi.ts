import type { RestClient } from "../RestClient.js";
import type {
  Guild,
  GuildBan,
  GuildChannel,
  GuildEvent,
  GuildInvite,
  GuildListResponse,
  GuildMember,
  GuildRole,
  GuildVoiceState,
} from "../../structures/Guild.js";
import type {
  JsonObject,
  MessageEnvelope,
  Pagination,
  Snowflake,
} from "../../util/types.js";
import { encodeId, encodeQuery } from "../utils.js";

export type GuildForm = JsonObject | FormData;

export class GuildsApi {
  constructor(private readonly rest: RestClient) {}

  list(query?: Pagination): Promise<GuildListResponse> {
    return this.rest.get("/guilds", encodeQuery(query));
  }

  create(input: GuildForm): Promise<{ guild: Guild }> {
    return this.rest.post("/guilds", input);
  }

  update(
    guildId: Snowflake | string,
    input: GuildForm,
  ): Promise<{ guild: Guild }> {
    return this.rest.patch(`/guilds/${encodeId(guildId)}`, input);
  }

  delete(guildId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/guilds/${encodeId(guildId)}`);
  }

  auditLogs(
    guildId: Snowflake | string,
    query?: Pagination,
  ): Promise<JsonObject> {
    return this.rest.get(
      `/guilds/${encodeId(guildId)}/audit-logs`,
      encodeQuery(query),
    );
  }

  bans(guildId: Snowflake | string): Promise<{ bans: GuildBan[] }> {
    return this.rest.get(`/guilds/${encodeId(guildId)}/bans`);
  }

  ban(
    guildId: Snowflake | string,
    userId: Snowflake | string,
    input: JsonObject = {},
  ): Promise<MessageEnvelope> {
    return this.rest.post(
      `/guilds/${encodeId(guildId)}/bans/${encodeId(userId)}`,
      input,
    );
  }

  unban(
    guildId: Snowflake | string,
    userId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/guilds/${encodeId(guildId)}/bans/${encodeId(userId)}`,
    );
  }

  channels(guildId: Snowflake | string): Promise<{ channels: GuildChannel[] }> {
    return this.rest.get(`/guilds/${encodeId(guildId)}/channels`);
  }

  createChannel(
    guildId: Snowflake | string,
    input: JsonObject,
  ): Promise<{ channel: GuildChannel }> {
    return this.rest.post(`/guilds/${encodeId(guildId)}/channels`, input);
  }

  reorderChannels(
    guildId: Snowflake | string,
    input: JsonObject,
  ): Promise<MessageEnvelope> {
    return this.rest.put(
      `/guilds/${encodeId(guildId)}/channels/reorder`,
      input,
    );
  }

  events(
    guildId: Snowflake | string,
    query?: Pagination,
  ): Promise<{ events: GuildEvent[] }> {
    return this.rest.get(
      `/guilds/${encodeId(guildId)}/events`,
      encodeQuery(query),
    );
  }

  createEvent(
    guildId: Snowflake | string,
    input: JsonObject,
  ): Promise<{ event: GuildEvent }> {
    return this.rest.post(`/guilds/${encodeId(guildId)}/events`, input);
  }

  updateEvent(
    guildId: Snowflake | string,
    eventId: Snowflake | string,
    input: JsonObject,
  ): Promise<{ event: GuildEvent }> {
    return this.rest.patch(
      `/guilds/${encodeId(guildId)}/events/${encodeId(eventId)}`,
      input,
    );
  }

  deleteEvent(
    guildId: Snowflake | string,
    eventId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/guilds/${encodeId(guildId)}/events/${encodeId(eventId)}`,
    );
  }

  invites(guildId: Snowflake | string): Promise<{ invites: GuildInvite[] }> {
    return this.rest.get(`/guilds/${encodeId(guildId)}/invites`);
  }

  createInvite(
    guildId: Snowflake | string,
    input: JsonObject = {},
  ): Promise<{ invite: GuildInvite }> {
    return this.rest.post(`/guilds/${encodeId(guildId)}/invites`, input);
  }

  deleteInvite(
    guildId: Snowflake | string,
    code: string,
  ): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/guilds/${encodeId(guildId)}/invites/${encodeURIComponent(code)}`,
    );
  }

  acceptInvite(code: string): Promise<{ guild: Guild }> {
    return this.rest.post(`/invites/${encodeURIComponent(code)}`);
  }

  members(
    guildId: Snowflake | string,
    query?: Pagination,
  ): Promise<{ members: GuildMember[] }> {
    return this.rest.get(
      `/guilds/${encodeId(guildId)}/members`,
      encodeQuery(query),
    );
  }

  updateMember(
    guildId: Snowflake | string,
    userId: Snowflake | string,
    input: JsonObject,
  ): Promise<{ member: GuildMember }> {
    return this.rest.patch(
      `/guilds/${encodeId(guildId)}/members/${encodeId(userId)}`,
      input,
    );
  }

  removeMember(
    guildId: Snowflake | string,
    userId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/guilds/${encodeId(guildId)}/members/${encodeId(userId)}`,
    );
  }

  addMemberRole(
    guildId: Snowflake | string,
    userId: Snowflake | string,
    roleId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.put(
      `/guilds/${encodeId(guildId)}/members/${encodeId(userId)}/roles/${encodeId(roleId)}`,
    );
  }

  removeMemberRole(
    guildId: Snowflake | string,
    userId: Snowflake | string,
    roleId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/guilds/${encodeId(guildId)}/members/${encodeId(userId)}/roles/${encodeId(roleId)}`,
    );
  }

  transferOwnership(
    guildId: Snowflake | string,
    userId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.post(
      `/guilds/${encodeId(guildId)}/members/${encodeId(userId)}/transfer-ownership`,
    );
  }

  searchMessages(
    guildId: Snowflake | string,
    query: JsonObject,
  ): Promise<JsonObject> {
    return this.rest.get(
      `/guilds/${encodeId(guildId)}/messages/search`,
      encodeQuery(query),
    );
  }

  roles(guildId: Snowflake | string): Promise<{ roles: GuildRole[] }> {
    return this.rest.get(`/guilds/${encodeId(guildId)}/roles`);
  }

  createRole(
    guildId: Snowflake | string,
    input: JsonObject,
  ): Promise<{ role: GuildRole }> {
    return this.rest.post(`/guilds/${encodeId(guildId)}/roles`, input);
  }

  updateRole(
    guildId: Snowflake | string,
    roleId: Snowflake | string,
    input: JsonObject,
  ): Promise<{ role: GuildRole }> {
    return this.rest.patch(
      `/guilds/${encodeId(guildId)}/roles/${encodeId(roleId)}`,
      input,
    );
  }

  deleteRole(
    guildId: Snowflake | string,
    roleId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/guilds/${encodeId(guildId)}/roles/${encodeId(roleId)}`,
    );
  }

  voiceStates(
    guildId: Snowflake | string,
  ): Promise<{ voiceStates: GuildVoiceState[] }> {
    return this.rest.get(`/guilds/${encodeId(guildId)}/voice-states`);
  }
}
