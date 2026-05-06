import type { RestClient } from "../RestClient.js";
import type { Notification } from "../../structures/Notification.js";
import type {
  CursorPagination,
  MessageEnvelope,
  PageInfo,
} from "../../util/types.js";
import { encodeId, encodeQuery } from "../utils.js";
import type { PostListResponse } from "./PostsApi.js";
import {
  iterateCursorPages,
  type CursorPaginationOptions,
} from "../../util/pagination.js";
import { assertArrayResponse } from "../../util/validation.js";

export interface NotificationListResponse {
  notifications: Notification[];
  pagination?: PageInfo;
}

export interface NotificationGroupedPostsQuery extends CursorPagination {
  notificationIds?: string[];
}

export interface NotificationReadAllInput {
  types?: string[];
}

export class NotificationsApi {
  constructor(private readonly rest: RestClient) {}

  list(query?: CursorPagination): Promise<NotificationListResponse> {
    return this.rest
      .get<NotificationListResponse>("/notifications", encodeQuery(query))
      .then((response) =>
        validateListResponse(response, "notifications", "notifications.list"),
      );
  }

  iterList(
    query: CursorPagination = {},
    options: CursorPaginationOptions = {},
  ): AsyncGenerator<Notification> {
    return iterateCursorPages(
      (pageQuery) => this.list(pageQuery),
      (response) => response.notifications,
      query,
      options,
    );
  }

  unreadCount(): Promise<{ count: number }> {
    return this.rest.get("/notifications/unread/count");
  }

  groupedPosts(query?: NotificationGroupedPostsQuery): Promise<PostListResponse> {
    return this.rest
      .get<PostListResponse>("/notifications/grouped-posts", encodeQuery(query))
      .then((response) =>
        validateListResponse(response, "posts", "notifications.groupedPosts"),
      );
  }

  markAllRead(input: NotificationReadAllInput = {}): Promise<MessageEnvelope> {
    return this.rest.patch("/notifications/read-all", input);
  }

  markRead(id: string): Promise<MessageEnvelope> {
    return this.rest.patch(`/notifications/${encodeId(id)}/read`);
  }

  delete(id: string): Promise<MessageEnvelope> {
    return this.rest.delete(`/notifications/${encodeId(id)}`);
  }

  deleteAll(): Promise<MessageEnvelope> {
    return this.rest.delete("/notifications/all");
  }

  registerPush(input: {
    token: string;
    deviceId?: string;
  }): Promise<MessageEnvelope> {
    return this.rest.post("/notifications/push/register", {
      token: input.token,
      deviceId: input.deviceId ?? this.rest.auth.deviceId,
    });
  }

  unregisterPush(token: string, deviceId?: string): Promise<MessageEnvelope> {
    return this.rest.post("/notifications/push/unregister", {
      token,
      deviceId: deviceId ?? this.rest.auth.deviceId,
    });
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
