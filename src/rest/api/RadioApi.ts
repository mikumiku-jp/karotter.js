import type { RestClient } from "../RestClient.js";
import type {
  IceServer,
  RadioMessage,
  RadioRole,
  RadioSettings,
  RadioSpace,
} from "../../structures/Radio.js";
import type {
  MessageEnvelope,
  PageInfo,
  Pagination,
  Snowflake,
} from "../../util/types.js";
import { encodeId, encodeQuery } from "../utils.js";

export class RadioApi {
  constructor(private readonly rest: RestClient) {}

  create(input: {
    title: string;
    description?: string | null;
    mode?: "PUBLIC" | "FOLLOWERS_ONLY" | "INVITE_ONLY" | (string & {});
    speakerPermission?:
      | "FOLLOWING_ONLY"
      | "EVERYONE"
      | "INVITED_ONLY"
      | (string & {});
  }): Promise<{ space: RadioSpace }> {
    return this.rest.post("/radio", input);
  }

  fetch(id: Snowflake | string): Promise<{ space: RadioSpace }> {
    return this.rest.get(`/radio/${encodeId(id)}`);
  }

  active(): Promise<{ spaces: RadioSpace[]; pagination?: PageInfo }> {
    return this.rest.get("/radio/active");
  }

  mine(): Promise<{ spaces: RadioSpace[]; pagination?: PageInfo }> {
    return this.rest.get("/radio/me");
  }

  upcoming(): Promise<{ spaces: RadioSpace[]; pagination?: PageInfo }> {
    return this.rest.get("/radio/upcoming");
  }

  iceServers(): Promise<{ iceServers: IceServer[] }> {
    return this.rest.get("/radio/ice-servers");
  }

  messages(
    id: Snowflake | string,
    query?: Pagination,
  ): Promise<{ messages: RadioMessage[]; pagination?: PageInfo }> {
    return this.rest.get(`/radio/${encodeId(id)}/messages`, encodeQuery(query));
  }

  sendMessage(
    id: Snowflake | string,
    content: string,
  ): Promise<{ message: RadioMessage }> {
    return this.rest.post(`/radio/${encodeId(id)}/messages`, { content });
  }

  join(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/radio/${encodeId(id)}/join`);
  }

  leave(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/radio/${encodeId(id)}/leave`);
  }

  end(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/radio/${encodeId(id)}/end`);
  }

  requestSpeaker(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/radio/${encodeId(id)}/request-speaker`);
  }

  acceptSpeakerInvite(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/radio/${encodeId(id)}/accept-speaker-invite`);
  }

  inviteSpeaker(
    id: Snowflake | string,
    participantId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.post(
      `/radio/${encodeId(id)}/participants/${encodeId(participantId)}/invite-speaker`,
    );
  }

  cancelSpeakerInvite(
    id: Snowflake | string,
    participantId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/radio/${encodeId(id)}/participants/${encodeId(participantId)}/invite-speaker`,
    );
  }

  muteParticipant(
    id: Snowflake | string,
    participantId: Snowflake | string,
    isMuted: boolean,
  ): Promise<MessageEnvelope> {
    return this.rest.patch(
      `/radio/${encodeId(id)}/participants/${encodeId(participantId)}/mute`,
      { isMuted },
    );
  }

  setParticipantRole(
    id: Snowflake | string,
    participantId: Snowflake | string,
    role: RadioRole,
  ): Promise<MessageEnvelope> {
    return this.rest.patch(
      `/radio/${encodeId(id)}/participants/${encodeId(participantId)}/role`,
      { role },
    );
  }

  realtimeToken(id: Snowflake | string): Promise<{ token: string; url?: string }> {
    return this.rest.get(`/radio/${encodeId(id)}/realtime-token`);
  }

  transferHost(
    id: Snowflake | string,
    participantId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.post(
      `/radio/${encodeId(id)}/participants/${encodeId(participantId)}/transfer-host`,
    );
  }

  updateSettings(
    id: Snowflake | string,
    settings: RadioSettings,
  ): Promise<{ space: RadioSpace }> {
    return this.rest.patch(`/radio/${encodeId(id)}/settings`, settings);
  }
}
