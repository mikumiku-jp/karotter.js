# DM・通知 API

DM グループ、メッセージ、通話、通知、Push token を扱う。リアルタイムイベントは [Realtime API](./13-realtime.md) を参照。

## DM endpoint

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/dm/groups` | 必須 | Query: `Pagination` | `DmGroupsResponse` | DM グループ一覧 |
| GET | `/dm/unread/count` | 必須 | なし | `DmUnreadCount` | 未読数 |
| POST | `/dm/groups` | 必須 | `{ userIds: number[], name?: string \| null, isGroup?: boolean }` | `{ group: DmGroup }` | 名前付きグループまたは複数人 DM を作成 |
| POST | `/dm/start` | 必須 | `{ targetUserId: number }` | `{ group: DmGroup }` | 1 対 1 DM を開始または取得 |
| GET | `/dm/groups/{groupId}` | 必須 | なし | `{ group: DmGroup }` | グループ取得 |
| PATCH | `/dm/groups/{groupId}` | 必須 | `{ name?: string, memberIds?: (number|string)[] }` | `{ group: DmGroup }` | グループ更新 |
| DELETE | `/dm/groups/{groupId}` | 必須 | なし | `MessageEnvelope` | グループ削除 |
| GET | `/dm/groups/{groupId}/messages` | 必須 | Query: `Pagination` | `DmMessagesResponse` | メッセージ一覧 |
| POST | `/dm/groups/{groupId}/messages` | 必須 | `multipart/form-data`: `SendDmForm` | `{ message: DmMessage }` | メッセージ送信 |
| POST | `/dm/groups/{groupId}/read` | 必須 | なし | `MessageEnvelope` | グループを既読化 |
| POST | `/dm/groups/{groupId}/leave` | 必須 | なし | `MessageEnvelope` | グループ退出 |
| POST | `/dm/groups/{groupId}/clear` | 必須 | なし | `MessageEnvelope` | 自分の履歴を消去 |
| POST | `/dm/groups/{groupId}/members` | 必須 | `{ userIds: number[] }` または `{ userId: number }` | `MessageEnvelope` | メンバー追加 |
| DELETE | `/dm/groups/{groupId}/members/{userId}` | 必須 | なし | `MessageEnvelope` | メンバー削除 |
| POST | `/dm/groups/{groupId}/request/accept` | 必須 | なし | `MessageEnvelope` | DM リクエスト承認 |
| POST | `/dm/groups/{groupId}/request/reject` | 必須 | なし | `MessageEnvelope` | DM リクエスト拒否 |
| GET | `/dm/groups/{groupId}/call` | 必須 | なし | `{ call: ActiveCall | null }` | 通話状態 |
| POST | `/dm/groups/{groupId}/call/start` | 必須 | `JsonObject?` | `{ call: ActiveCall }` | 通話開始 |
| POST | `/dm/groups/{groupId}/call/join` | 必須 | `JsonObject?` | `{ call: ActiveCall }` | 通話参加 |
| POST | `/dm/groups/{groupId}/call/leave` | 必須 | `JsonObject?` | `MessageEnvelope` | 通話退出 |
| GET | `/dm/groups/{groupId}/info` | 必須 | なし | `{ group: DmGroup }` | グループ詳細 |
| GET | `/dm/groups/{groupId}/settings` | 必須 | なし | `DmGroupSettings` | グループ設定 |
| PATCH | `/dm/groups/{groupId}/settings` | 必須 | `DmGroupSettings` | `DmGroupSettings` | グループ設定更新 |
| GET | `/dm/me/settings` | 必須 | なし | `DmGroupSettings` | 自分の DM 設定 |
| POST | `/dm/groups/{groupId}/typing` | 必須 | なし | `MessageEnvelope` | 入力中通知開始 |
| POST | `/dm/groups/{groupId}/typing/stop` | 必須 | なし | `MessageEnvelope` | 入力中通知停止 |
| GET | `/dm/groups/{groupId}/files` | 必須 | なし | `{ files: DmFile[] }` | 添付ファイル一覧 |
| GET | `/dm/groups/{groupId}/media` | 必須 | なし | `{ media: DmFile[] }` | メディア一覧 |
| POST | `/dm/groups/{groupId}/pin` | 必須 | `{ messageId: number|string }` | `MessageEnvelope` | グループ経由でメッセージを固定 |
| GET | `/dm/groups/{groupId}/pinned` | 必須 | なし | `{ messages: DmMessage[] }` | 固定メッセージ一覧 |
| PATCH | `/dm/messages/{messageId}` | 必須 | `{ content: string }` | `{ message: DmMessage }` | メッセージ編集 |
| DELETE | `/dm/messages/{messageId}` | 必須 | なし | `MessageEnvelope` | メッセージ削除 |
| POST | `/dm/messages/{messageId}/reactions` | 必須 | `{ emoji: ReactionCode }` | `MessageEnvelope` | リアクション追加。`pro:*` は Pro 限定 |
| DELETE | `/dm/messages/{messageId}/reactions/{emoji}` | 必須 | なし | `MessageEnvelope` | 指定リアクション削除 |
| DELETE | `/dm/messages/{messageId}/reactions` | 必須 | なし | `MessageEnvelope` | 自分のリアクション削除 |
| POST | `/dm/messages/{messageId}/poll/vote` | 必須 | `{ optionId: number }` | `MessageEnvelope` | DM 投票 |
| POST | `/dm/messages/{messageId}/pin` | 必須 | なし | `MessageEnvelope` | メッセージ固定 |
| DELETE | `/dm/messages/{messageId}/pin` | 必須 | なし | `MessageEnvelope` | 固定解除 |
| POST | `/dm/messages/{messageId}/report` | 必須 | `{ reason: string, description?: string }` | `MessageEnvelope` | メッセージ通報 |
| POST | `/dm/messages/{messageId}/translate` | 必須 | `{ targetLanguage: string }` | `{ translation: string, sourceLanguage?: string }` | メッセージ翻訳 |
| GET | `/dm/calls/active` | 必須 | なし | `{ calls: ActiveCall[] }` | アクティブ通話一覧 |
| GET | `/dm/me/calls` | 必須 | なし | `{ calls: ActiveCall[] }` | 自分が関係する通話 |

## DM message multipart

| Form field | 型 | 必須 | 制約 |
|---|---|---:|---|
| `content` | string | 条件付き | 空白のみ不可 |
| `replyToId` | number/string | いいえ | 返信先メッセージ ID |
| `pollOptions` | JSON 化した `string[]` | いいえ | 2 件以上、各項目は空白のみ不可 |
| `pollDurationHours` | number | いいえ | 正の整数 |
| `attachments` | File/Blob[] | いいえ | 添付本体 |
| `attachmentAlts` | JSON 化した `string[]` | いいえ | 添付と同順。未指定は空文字 |
| `attachmentSpoilerFlags` | JSON 化した `boolean[]` | いいえ | 添付と同順。未指定は `false` |
| `attachmentR18Flags` | JSON 化した `boolean[]` | いいえ | 添付と同順。未指定は `false` |

本文、添付、投票のいずれかが必要。すべて空の場合は SDK が送信前に `ValidationError` を投げる。

## DM response schema

```ts
interface DmGroupsResponse {
  groups: DmGroup[];
  pagination?: PageInfo;
}

interface DmMessagesResponse {
  messages: DmMessage[];
  pagination?: PageInfo;
}

interface DmUnreadCount {
  count?: number;
  unreadCount?: number;
}

interface DmGroupSettings {
  notificationsEnabled?: boolean;
  readReceiptsEnabled?: boolean;
  callPermission?: string;
  [extra: string]: unknown;
}
```

未読数はサーバーバージョン差を吸収するため `count` と `unreadCount` の両方を許容する。`callPermission` と通話開始・参加の追加 body は安定した公開 schema が確認できていない。

## DM の SSE URL

REST base URL が `https://api.karotter.com` の場合、SDK は次の URL を構築する。SSE の認証・イベント形式は SPA 確認の範囲であり、Socket.IO の型付きイベントより安定性が低い。

| Scope | URL |
|---|---|
| DM 全体 | `https://api.karotter.com/api/dm/stream` |
| グループ | `https://api.karotter.com/api/dm/groups/{groupId}/stream` |
| メッセージ | `https://api.karotter.com/api/dm/messages/stream` |

## 通知 endpoint

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/notifications` | 必須 | Query: `NotificationListQuery` | `NotificationListResponse` | 通知一覧。`types` は comma 区切り |
| GET | `/notifications/unread/count` | 必須 | なし | `{ count: number }` | 未読通知数 |
| GET | `/notifications/grouped-posts` | 必須 | Query: `NotificationGroupedPostsQuery` | `PostListResponse` | 通知に関係する投稿を集約 |
| PATCH | `/notifications/read-all` | 必須 | Query: `{ types?: string }`、body なし | `MessageEnvelope` | comma 区切りの対象種別または全通知を既読化 |
| PATCH | `/notifications/{id}/read` | 必須 | なし | `MessageEnvelope` | 1 件を既読化 |
| DELETE | `/notifications/{id}` | 必須 | なし | `MessageEnvelope` | 1 件削除 |
| DELETE | `/notifications/all` | 必須 | なし | `MessageEnvelope` | 全件削除 |
| POST | `/notifications/push/register` | 必須 | `PushRegistrationInput` | `MessageEnvelope` | Push token 登録 |
| POST | `/notifications/push/unregister` | 必須 | `{ token, deviceId? }` | `MessageEnvelope` | Push token 解除 |

```ts
interface NotificationListResponse {
  notifications: Notification[];
  pagination?: PageInfo;
}

interface NotificationListQuery {
  page?: number;
  limit?: number;
  types?: NotificationType[] | string;
}

interface NotificationGroupedPostsQuery {
  limit?: number;
  cursor?: string;
  notificationIds?: string[];
}

interface PushRegistrationInput {
  token: string;
  platform?: "web" | "ios" | "android";
  deviceId?: string;
}
```

`deviceId` と登録時の `platform` を省略した場合、SDK は認証ストアの端末 ID とクライアント種別を送る。`markAllRead({ types })` は配列を comma 区切りの query に変換し、JSON body は送らない。通知 type は `REPLY`、`MENTION`、`FOLLOW`、`FOLLOW_REQUEST`、`LIKE`、`REKAROT`、`QUOTE`、`REACTION`、`DM` が確認済みだが、将来の追加値を許容する。
