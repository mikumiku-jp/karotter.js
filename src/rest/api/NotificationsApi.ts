import type { RestClient } from "../RestClient.js";
import type {
  Notification,
  NotificationType,
} from "../../structures/Notification.js";
import type {
  ClientType,
  CursorPagination,
  MessageEnvelope,
  OffsetPagination,
  PageInfo,
} from "../../util/types.js";
import { encodeId, encodeQuery } from "../utils.js";
import type { PostListResponse } from "./PostsApi.js";
import {
  iterateOffsetPages,
  type OffsetPaginationOptions,
} from "../../util/pagination.js";
import { assertArrayResponse } from "../../util/validation.js";

export interface NotificationListResponse {
  notifications: Notification[];
  pagination?: PageInfo;
}

export interface NotificationListQuery extends OffsetPagination {
  types?: NotificationType[] | string;
}

export interface NotificationGroupedPostsQuery extends CursorPagination {
  notificationIds?: string[];
}

export interface NotificationReadAllInput {
  types?: NotificationType[];
}

export interface PushRegistrationInput {
  token: string;
  platform?: ClientType;
  deviceId?: string;
}

export class NotificationsApi {
  constructor(private readonly rest: RestClient) {}

  list(query: NotificationListQuery = {}): Promise<NotificationListResponse> {
    return this.rest
      .get<NotificationListResponse>(
        "/notifications",
        encodeQuery({
          ...query,
          types: joinNotificationTypes(query.types),
        }),
      )
      .then((response) =>
        validateListResponse(response, "notifications", "notifications.list"),
      );
  }

  iterList(
    query: NotificationListQuery = {},
    options: OffsetPaginationOptions = {},
  ): AsyncGenerator<Notification> {
    return iterateOffsetPages(
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
    return this.rest.patch(
      "/notifications/read-all",
      undefined,
      encodeQuery({ types: joinNotificationTypes(input.types) }),
    );
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

  registerPush(input: PushRegistrationInput): Promise<MessageEnvelope> {
    return this.rest.post("/notifications/push/register", {
      token: input.token,
      platform: input.platform ?? this.rest.auth.clientType,
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

function joinNotificationTypes(
  types: NotificationType[] | string | undefined,
): string | undefined {
  return Array.isArray(types) ? types.join(",") : types;
}

function validateListResponse<T>(
  response: T,
  key: string,
  context: string,
): T {
  assertArrayResponse(response, key, context);
  return response;
}
