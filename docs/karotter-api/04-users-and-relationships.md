# ユーザー・関係 API

プロフィール、ユーザー別投稿、設定、フォロー、ブロック、ミュートを扱う。`User`、`UserDetail`、`PostListResponse` は [データスキーマ](./14-schemas.md) を参照。

## ユーザー endpoint

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/users/{usernameOrId}` | 不要 | Query: `{ includeMutedOrBlocked?: boolean }` | `UserDetail` | username または ID で取得 |
| GET | `/users/{userId}/posts` | プライバシー依存 | Query: `Pagination` | `PostListResponse` | 投稿一覧。非公開アカウントは本人・承認済み follower のみ |
| GET | `/users/{userId}/likes` | プライバシー依存 | Query: `Pagination` | `PostListResponse` | いいね一覧。非公開設定では 403 |
| GET | `/users/{userId}/media` | プライバシー依存 | Query: `Pagination` | `PostListResponse` | メディア付き投稿 |
| GET | `/users/{userId}/replies` | プライバシー依存 | Query: `Pagination` | `PostListResponse` | 返信一覧 |
| GET | `/users/{userId}/followers` | プライバシー依存 | Query: `UserListQuery` | `UserListResponse` | フォロワー。`q` で絞り込み可能。非公開アカウントは本人・承認済み follower のみ |
| GET | `/users/{userId}/following` | プライバシー依存 | Query: `UserListQuery` | `UserListResponse` | フォロー中。`q` で絞り込み可能。非公開アカウントは本人・承認済み follower のみ |
| GET | `/users/{userId}/mutual-followers` | 必須 | Query: `UserListQuery` | `UserListResponse` | 共通フォロワー。`q` で絞り込み可能 |
| GET | `/users/recommended` | 不要 | Query: `{ limit?: number }` | `UserListResponse` | おすすめユーザー |
| GET | `/users/level-ranking` | 不要 | Query: `Pagination` | `{ users: User[] }` | レベルランキング |
| GET | `/users/username/quota` | 必須 | なし | `UsernameQuota` | username 変更可能回数 |
| PATCH | `/users/profile` | 必須 | `ProfileUpdate` | `{ message: string, user: User }` | プロフィール更新 |
| PATCH | `/users/status` | 必須 | `StatusUpdate` | `StatusUpdateResponse` | オンライン状態更新 |
| PATCH | `/users/settings` | 必須 | `UserSettings` | `UserSettings` | アカウント・通知設定更新 |
| PATCH | `/users/password` | 必須 | `{ currentPassword: string, newPassword: string }` | `MessageEnvelope` | パスワード変更 |
| PATCH | `/users/username` | 必須 | `{ username: string }` | `UsernameUpdateResponse` | username 変更 |
| PATCH | `/users/profile/pinned-post` | 必須 | `{ postId: number \| null, pinned: boolean }` | `PinnedPostUpdateResponse` | 投稿の固定・固定解除。Free 1件、Plus 3件、Pro 5件 |
| DELETE | `/users/account` | 必須 | `{ password: string }` | `MessageEnvelope` | アカウント削除 |
| POST | `/profile/avatar` | 必須 | `multipart/form-data`: `avatar` | `{ message: string, imageUrl: string }` | アバター更新 |
| POST | `/profile/header` | 必須 | `multipart/form-data`: `header` | `{ message: string, imageUrl: string }` | ヘッダー更新 |

## フォロー・ブロック・ミュート endpoint

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| POST | `/follow/{userId}` | 必須 | なし | `MessageEnvelope` | フォロー。非公開アカウントでは申請になる場合がある |
| DELETE | `/follow/{userId}` | 必須 | なし | `MessageEnvelope` | フォロー解除 |
| DELETE | `/follow/follower/{userId}` | 必須 | なし | `MessageEnvelope` | 自分のフォロワーから削除 |
| GET | `/follow/requests/pending` | 必須 | なし | `{ requests: FollowRequest[] }` | 承認待ち申請 |
| POST | `/follow/requests/{requestId}/accept` | 必須 | なし | `MessageEnvelope` | 申請承認 |
| POST | `/follow/requests/{requestId}/reject` | 必須 | なし | `MessageEnvelope` | 申請拒否 |
| POST | `/follow/{userId}/post-notify` | 必須 | なし | `MessageEnvelope` | 対象ユーザーの投稿通知を有効化 |
| DELETE | `/follow/{userId}/post-notify` | 必須 | なし | `MessageEnvelope` | 投稿通知を無効化 |
| GET | `/follow/block` | 必須 | なし | `UserListResponse` | ブロック一覧 |
| POST | `/follow/block/{userId}` | 必須 | なし | `MessageEnvelope` | ブロック |
| DELETE | `/follow/block/{userId}` | 必須 | なし | `MessageEnvelope` | ブロック解除 |
| GET | `/follow/mute` | 必須 | なし | `UserListResponse` | ミュート一覧 |
| POST | `/follow/mute/{userId}` | 必須 | なし | `MessageEnvelope` | ミュート |
| DELETE | `/follow/mute/{userId}` | 必須 | なし | `MessageEnvelope` | ミュート解除 |
| POST | `/follow/hide-rekarots/{userId}` | 必須 | なし | `MessageEnvelope` | 対象のリカロートを非表示 |
| DELETE | `/follow/hide-rekarots/{userId}` | 必須 | なし | `MessageEnvelope` | リカロート表示を復元 |

## Request schema

```ts
interface ProfileUpdate {
  displayName?: string;
  bio?: string;
  websiteUrl?: string;
  location?: string;
  birthday?: string | null;
  displayBirthday?: string | null;
  birthdayVisibility?: ProfileVisibility;
  birthdayBalloonsEnabled?: boolean;
  gender?: "MALE" | "FEMALE" | "OTHER";
}

interface StatusUpdate {
  status?: "ONLINE" | "OFFLINE" | "INVISIBLE" | string;
  statusMessage?: string;
}

type ProfileVisibility =
  | "PUBLIC"
  | "FOLLOWERS"
  | "PRIVATE"
  | string;

type DmRequestPolicy =
  | "EVERYONE"
  | "VERIFIED_ONLY"
  | "FOLLOWERS_ONLY"
  | "NONE"
  | string;


interface UserListQuery extends Pagination {
  q?: string;
}
interface UserSettings {
  isPrivate?: boolean;
  onlineStatusVisibility?: ProfileVisibility;
  showLikedPosts?: boolean;
  showReadReceipts?: boolean;
  directMessagesEnabled?: boolean;
  questionsEnabled?: boolean;
  giftsEnabled?: boolean;
  mutedKeywords?: string[];
  dmRequestPolicy?: DmRequestPolicy;
  notifyLikes?: boolean;
  notifyRekarots?: boolean;
  notifyReplies?: boolean;
  notifyMentions?: boolean;
  notifyFollows?: boolean;
  notifyQuotes?: boolean;
  notifyReactions?: boolean;
  notifyDMs?: boolean;
  notifyBoardActivity?: boolean;
  notifyNewsOnLaunch?: boolean;
  notificationToastEnabled?: boolean;
  notificationToastPosition?: string;
  notificationToastDurationMs?: number;
  showReactions?: boolean;
  notificationMuteNonFollowing?: boolean;
  notificationMuteNonFollowers?: boolean;
  notificationMuteNewAccounts?: boolean;
  notificationMuteNoAvatar?: boolean;
  showHiddenPosts?: boolean;
  showParodyAccounts?: boolean;
  showBotAccounts?: boolean;
  showR18Content?: boolean;
  showRepliesInTimeline?: boolean;
  showRekarotsInTimeline?: boolean;
  hideUnfollowedRekarotsInTimeline?: boolean;
  defaultExcludeReplyTargets?: boolean;
  levelEnabled?: boolean;
  isBotAccount?: boolean;
  isParodyAccount?: boolean;
  profileMinimumAge?: number | null;
  profileMaximumAge?: number | null;
  hideProfileFromMinors?: boolean;
  pushNotificationsEnabled?: boolean;
  legalNoticeSeenVersion?: string | null;
}
```

`ProfileVisibility` は誕生日とオンライン状態の公開範囲に使う。`DmRequestPolicy` は全員、認証済みアカウント、フォロワー、受信拒否を区別する。型は将来の追加値も許容する。

## Response schema

```ts
interface UsernameQuota {
  windowDays: number;
  maxChanges: number;
  usedChanges: number;
  remainingChanges: number;
}

interface StatusUpdateResponse {
  message: string;
  status?: "ONLINE" | "OFFLINE" | "INVISIBLE" | string;
  statusMessage?: string;
}

interface UsernameUpdateResponse {
  message: string;
  user?: User;
  limit?: {
    windowDays: number;
    maxChanges: number;
  };
}

interface PinnedPostUpdateResponse {
  message: string;
  pinnedPostId?: number | null;
  pinnedPostIds?: number[];
  pinnedPostLimit?: number;
}

interface FollowRequest {
  id: number;
  sender: User;
  recipient?: User;
  senderId?: number;
  recipientId?: number;
  createdAt?: string;
}
```

## 非公開アカウントの処理

1. `PATCH /users/settings` に `{ isPrivate: true }` を送り、アカウントを非公開へ切り替える。
2. 非公開ユーザーへの `POST /follow/{userId}` は即時 follow ではなく申請になる。`UserDetail.hasPendingRequest` で申請中を判定する。
3. 対象ユーザーは `GET /follow/requests/pending` で申請を取得し、request の `sender` を表示する。
4. `POST /follow/requests/{requestId}/accept` または `/reject` で回答する。
5. 承認済み follower だけが非公開ユーザーの投稿・返信・メディア・フォロー関係を閲覧できる。`showLikedPosts=false` の場合、いいね一覧は承認済み follower にも公開されない。SDK 側で公開扱いに fallback せず、403 とサーバー response をそのまま扱う。
6. `DELETE /follow/follower/{userId}` で承認済み follower を外せる。再度閲覧するには新しい申請と承認が必要になる。

`GET /users/{usernameOrId}` の relation field は `isFollowing` と `hasPendingRequest` を区別する。非公開アカウントへの申請直後に follower 数を増やしたり、`isFollowing=true` と仮定しない。

複数固定は `client.users.setPinnedPost(post, true)`、固定解除は `client.users.setPinnedPost(post, false)` を使う。解除対象の `postId` を省略しない。現在の固定状態は `User.pinnedPostIds`、`UserDetail.pinnedPosts`、上限は `User.pinnedPostLimit` で取得する。

## 権限とプライバシー

- `GET /users/{usernameOrId}` は公開情報と閲覧者との関係だけを返し、他人の `email` は含まない。
- いいね、フォロー関係、オンライン状態、DM・質問・Gift の可否は対象ユーザーの設定と閲覧者との関係により非表示または 403 になる。
- `showLikedPosts=false` のユーザーに対する likes tab は表示せず、`GET /users/{userId}/likes` の 403 を正常なプライバシー制御として扱う。
- `includeMutedOrBlocked=true` は SDK で送信できるが、管理権限を付与するものではない。サーバーの可視性判定が優先される。
- `DELETE /users/account` は DELETE request の JSON body として `password` を送る。
- ブロック、ミュート、フォロー操作の成功 response は通常 `MessageEnvelope`。関係状態の完全なスナップショットは返さないため、必要ならユーザー詳細を再取得する。
