import type { RestClient } from "../RestClient.js";
import type { UserDetail, User } from "../../structures/User.js";
import type {
  Gender,
  MessageEnvelope,
  Pagination,
  Snowflake,
  UserOnlineStatus,
} from "../../util/types.js";
import { appendMedia, type MediaInput } from "../../util/form.js";
import { encodeId, encodeQuery } from "../utils.js";
import type { PostListResponse, UserListResponse } from "./PostsApi.js";

export interface ProfileUpdate {
  displayName?: string;
  bio?: string;
  websiteUrl?: string;
  location?: string;
  birthday?: string;
  birthdayVisibility?: "PUBLIC" | "FOLLOWERS" | "PRIVATE";
  gender?: Gender;
}

export interface StatusUpdate {
  status?: UserOnlineStatus;
  statusMessage?: string;
}

export interface UserSettings {
  isPrivate?: boolean;
  onlineStatusVisibility?: string;
  showLikedPosts?: boolean;
  showReadReceipts?: boolean;
  directMessagesEnabled?: boolean;
  mutedKeywords?: string[];
  dmRequestPolicy?: string;
  notifyLikes?: boolean;
  notifyRekarots?: boolean;
  notifyReplies?: boolean;
  notifyMentions?: boolean;
  notifyFollows?: boolean;
  notifyQuotes?: boolean;
  notifyReactions?: boolean;
  notifyDMs?: boolean;
  notificationMuteNonFollowing?: boolean;
  notificationMuteNonFollowers?: boolean;
  notificationMuteNewAccounts?: boolean;
  notificationMuteNoAvatar?: boolean;
  showHiddenPosts?: boolean;
  showParodyAccounts?: boolean;
  showBotAccounts?: boolean;
  showR18Content?: boolean;
  isBotAccount?: boolean;
  isParodyAccount?: boolean;
  hideProfileFromMinors?: boolean;
}

export interface UsernameQuota {
  windowDays: number;
  maxChanges: number;
  usedChanges: number;
  remainingChanges: number;
}

export interface UserFetchQuery {
  includeMutedOrBlocked?: boolean;
}

export class UsersApi {
  constructor(private readonly rest: RestClient) {}

  fetch(
    usernameOrId: Snowflake | string,
    query?: UserFetchQuery,
  ): Promise<UserDetail> {
    return this.rest.get(`/users/${encodeId(usernameOrId)}`, encodeQuery(query));
  }

  posts(userId: Snowflake | string, query?: Pagination): Promise<PostListResponse> {
    return this.rest.get(`/users/${encodeId(userId)}/posts`, encodeQuery(query));
  }

  likes(userId: Snowflake | string, query?: Pagination): Promise<PostListResponse> {
    return this.rest.get(`/users/${encodeId(userId)}/likes`, encodeQuery(query));
  }

  media(userId: Snowflake | string, query?: Pagination): Promise<PostListResponse> {
    return this.rest.get(`/users/${encodeId(userId)}/media`, encodeQuery(query));
  }

  replies(userId: Snowflake | string, query?: Pagination): Promise<PostListResponse> {
    return this.rest.get(`/users/${encodeId(userId)}/replies`, encodeQuery(query));
  }

  followers(userId: Snowflake | string, query?: Pagination): Promise<UserListResponse> {
    return this.rest.get(`/users/${encodeId(userId)}/followers`, encodeQuery(query));
  }

  following(userId: Snowflake | string, query?: Pagination): Promise<UserListResponse> {
    return this.rest.get(`/users/${encodeId(userId)}/following`, encodeQuery(query));
  }

  mutualFollowers(
    userId: Snowflake | string,
    query?: Pagination,
  ): Promise<UserListResponse> {
    return this.rest.get(
      `/users/${encodeId(userId)}/mutual-followers`,
      encodeQuery(query),
    );
  }

  recommended(query?: { limit?: number }): Promise<UserListResponse> {
    return this.rest.get("/users/recommended", encodeQuery(query));
  }

  usernameQuota(): Promise<UsernameQuota> {
    return this.rest.get("/users/username/quota");
  }

  updateProfile(input: ProfileUpdate): Promise<{ message: string; user: User }> {
    return this.rest.patch("/users/profile", input);
  }

  updateStatus(input: StatusUpdate): Promise<{
    message: string;
    status?: UserOnlineStatus;
    statusMessage?: string;
  }> {
    return this.rest.patch("/users/status", input);
  }

  updateSettings(input: UserSettings): Promise<UserSettings> {
    return this.rest.patch("/users/settings", input);
  }

  updatePassword(input: {
    currentPassword: string;
    newPassword: string;
  }): Promise<MessageEnvelope> {
    return this.rest.patch("/users/password", input);
  }

  updateUsername(username: string): Promise<{
    message: string;
    user?: User;
    limit?: { windowDays: number; maxChanges: number };
  }> {
    return this.rest.patch("/users/username", { username });
  }

  setPinnedPost(
    postId: Snowflake | null,
  ): Promise<{ message: string; pinnedPostId: Snowflake | null }> {
    return this.rest.patch(
      "/users/profile/pinned-post",
      postId === null ? {} : { postId },
    );
  }

  levelRanking(query?: Pagination): Promise<{ users: User[] }> {
    return this.rest.get("/users/level-ranking", encodeQuery(query));
  }

  deleteAccount(password: string): Promise<MessageEnvelope> {
    return this.rest.delete("/users/account", { data: { password } });
  }

  uploadAvatar(file: MediaInput): Promise<{ message: string; imageUrl: string }> {
    const form = new FormData();
    appendMedia(form, "avatar", file);
    return this.rest.post("/profile/avatar", form);
  }

  uploadHeader(file: MediaInput): Promise<{ message: string; imageUrl: string }> {
    const form = new FormData();
    appendMedia(form, "header", file);
    return this.rest.post("/profile/header", form);
  }
}
