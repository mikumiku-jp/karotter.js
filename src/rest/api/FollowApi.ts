import type { RestClient } from "../RestClient.js";
import type { IsoDate, MessageEnvelope, Snowflake } from "../../util/types.js";
import type { User } from "../../structures/User.js";
import type { UserListResponse } from "./PostsApi.js";
import { encodeId } from "../utils.js";

export type FollowRequestAction = "accept" | "reject";

export interface FollowRequest {
  id: Snowflake;
  sender: User;
  recipient?: User;
  senderId?: Snowflake;
  recipientId?: Snowflake;
  createdAt?: IsoDate;
  [extra: string]: unknown;
}

export class FollowApi {
  constructor(private readonly rest: RestClient) {}

  follow(userId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/follow/${encodeId(userId)}`);
  }

  unfollow(userId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/follow/${encodeId(userId)}`);
  }

  removeFollower(userId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/follow/follower/${encodeId(userId)}`);
  }

  pendingRequests(): Promise<{ requests: FollowRequest[] }> {
    return this.rest.get("/follow/requests/pending");
  }

  respondToRequest(
    requestId: Snowflake | string,
    action: FollowRequestAction,
  ): Promise<MessageEnvelope> {
    return this.rest.post(`/follow/requests/${encodeId(requestId)}/${action}`);
  }

  enablePostNotify(userId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/follow/${encodeId(userId)}/post-notify`);
  }

  disablePostNotify(userId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/follow/${encodeId(userId)}/post-notify`);
  }

  blocked(): Promise<UserListResponse> {
    return this.rest.get("/follow/block");
  }

  block(userId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/follow/block/${encodeId(userId)}`);
  }

  unblock(userId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/follow/block/${encodeId(userId)}`);
  }

  muted(): Promise<UserListResponse> {
    return this.rest.get("/follow/mute");
  }

  mute(userId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/follow/mute/${encodeId(userId)}`);
  }

  unmute(userId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/follow/mute/${encodeId(userId)}`);
  }

  hideRekarots(userId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/follow/hide-rekarots/${encodeId(userId)}`);
  }

  showRekarots(userId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/follow/hide-rekarots/${encodeId(userId)}`);
  }
}
