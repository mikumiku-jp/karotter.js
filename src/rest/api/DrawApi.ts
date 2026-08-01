import type { RestClient } from "../RestClient.js";
import type { DrawLayers, DrawRoom } from "../../structures/Draw.js";
import type { MessageEnvelope, Pagination } from "../../util/types.js";
import { encodeId, encodeQuery } from "../utils.js";

export class DrawApi {
  constructor(private readonly rest: RestClient) {}

  rooms(query?: Pagination): Promise<{ rooms: DrawRoom[] }> {
    return this.rest.get("/draw/rooms", encodeQuery(query));
  }

  myRooms(): Promise<{ rooms: DrawRoom[] }> {
    return this.rest.get("/draw/rooms/me");
  }

  createRoom(input: {
    name: string;
    isPrivate?: boolean;
    capacity?: number;
  }): Promise<{ room: DrawRoom }> {
    return this.rest.post("/draw/rooms", input);
  }

  fetchRoom(roomId: string): Promise<{ room: DrawRoom }> {
    return this.rest.get(`/draw/rooms/${encodeId(roomId)}`);
  }

  deleteRoom(roomId: string): Promise<MessageEnvelope> {
    return this.rest.delete(`/draw/rooms/${encodeId(roomId)}`);
  }

  joinRoom(roomId: string, inviteCode?: string): Promise<MessageEnvelope> {
    return this.rest.post(
      `/draw/rooms/${encodeId(roomId)}/join`,
      inviteCode ? { inviteCode } : {},
    );
  }

  sendChat(roomId: string, content: string): Promise<MessageEnvelope> {
    return this.rest.post(`/draw/rooms/${encodeId(roomId)}/chat`, { content });
  }

  rotateInvite(roomId: string): Promise<{ inviteCode: string }> {
    return this.rest.post(`/draw/rooms/${encodeId(roomId)}/invite/rotate`);
  }

  realtimeToken(roomId: string): Promise<{ token: string; url?: string }> {
    return this.rest.get(`/draw/rooms/${encodeId(roomId)}/realtime-token`);
  }

  syncLayers(roomId: string, layers: DrawLayers): Promise<MessageEnvelope> {
    return this.rest.put(`/draw/rooms/${encodeId(roomId)}/layers`, layers);
  }
}
