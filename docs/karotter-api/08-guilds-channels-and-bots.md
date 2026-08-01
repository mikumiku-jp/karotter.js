# Guild・Channel・Bot API

Guild、Channel、role、invite、voice、forum、Bot Application、Bot Token API を扱う。通常の Guild 操作はユーザー認証、Bot API は `Authorization: Bot <token>` を使う。

## Guild endpoint

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/guilds` | ユーザー | Query: `Pagination` | `GuildListResponse` | 所属 Guild 一覧 |
| POST | `/guilds` | ユーザー | `GuildForm` | `{ guild: Guild }` | 作成 |
| PATCH | `/guilds/{guildId}` | ユーザー | `GuildForm` | `{ guild: Guild }` | 更新 |
| DELETE | `/guilds/{guildId}` | ユーザー | なし | `MessageEnvelope` | 削除 |
| GET | `/guilds/{guildId}/audit-logs` | ユーザー | Query: `Pagination` | `JsonObject` | 監査ログ |
| GET | `/guilds/{guildId}/bans` | ユーザー | なし | `{ bans: GuildBan[] }` | Ban 一覧 |
| POST | `/guilds/{guildId}/bans/{userId}` | ユーザー | `JsonObject`。省略時 `{}` | `MessageEnvelope` | Ban |
| DELETE | `/guilds/{guildId}/bans/{userId}` | ユーザー | なし | `MessageEnvelope` | Ban 解除 |
| GET | `/guilds/{guildId}/channels` | ユーザー | なし | `{ channels: GuildChannel[] }` | Channel 一覧 |
| POST | `/guilds/{guildId}/channels` | ユーザー | `JsonObject` | `{ channel: GuildChannel }` | Channel 作成 |
| PUT | `/guilds/{guildId}/channels/reorder` | ユーザー | `JsonObject` | `MessageEnvelope` | Channel 並び替え |
| GET | `/guilds/{guildId}/events` | ユーザー | Query: `Pagination` | `{ events: GuildEvent[] }` | Event 一覧 |
| POST | `/guilds/{guildId}/events` | ユーザー | `JsonObject` | `{ event: GuildEvent }` | Event 作成 |
| PATCH | `/guilds/{guildId}/events/{eventId}` | ユーザー | `JsonObject` | `{ event: GuildEvent }` | Event 更新 |
| DELETE | `/guilds/{guildId}/events/{eventId}` | ユーザー | なし | `MessageEnvelope` | Event 削除 |
| GET | `/guilds/{guildId}/invites` | ユーザー | なし | `{ invites: GuildInvite[] }` | Invite 一覧 |
| POST | `/guilds/{guildId}/invites` | ユーザー | `JsonObject`。省略時 `{}` | `{ invite: GuildInvite }` | Invite 作成 |
| DELETE | `/guilds/{guildId}/invites/{code}` | ユーザー | なし | `MessageEnvelope` | Invite 削除 |
| POST | `/invites/{code}` | ユーザー | なし | `{ guild: Guild }` | Invite 受諾 |
| GET | `/guilds/{guildId}/members` | ユーザー | Query: `Pagination` | `{ members: GuildMember[] }` | Member 一覧 |
| PATCH | `/guilds/{guildId}/members/{userId}` | ユーザー | `JsonObject` | `{ member: GuildMember }` | nick などの Member 設定更新 |
| DELETE | `/guilds/{guildId}/members/{userId}` | ユーザー | なし | `MessageEnvelope` | Member 削除 |
| PUT | `/guilds/{guildId}/members/{userId}/roles/{roleId}` | ユーザー | なし | `MessageEnvelope` | role 追加 |
| DELETE | `/guilds/{guildId}/members/{userId}/roles/{roleId}` | ユーザー | なし | `MessageEnvelope` | role 削除 |
| POST | `/guilds/{guildId}/members/{userId}/transfer-ownership` | ユーザー | なし | `MessageEnvelope` | 所有権移譲 |
| GET | `/guilds/{guildId}/messages/search` | ユーザー | Query: `JsonObject` | `JsonObject` | Guild 内 Message 検索 |
| GET | `/guilds/{guildId}/roles` | ユーザー | なし | `{ roles: GuildRole[] }` | role 一覧 |
| POST | `/guilds/{guildId}/roles` | ユーザー | `JsonObject` | `{ role: GuildRole }` | role 作成 |
| PATCH | `/guilds/{guildId}/roles/{roleId}` | ユーザー | `JsonObject` | `{ role: GuildRole }` | role 更新 |
| DELETE | `/guilds/{guildId}/roles/{roleId}` | ユーザー | なし | `MessageEnvelope` | role 削除 |
| GET | `/guilds/{guildId}/voice-states` | ユーザー | なし | `{ voiceStates: GuildVoiceState[] }` | Voice State 一覧 |

`GuildForm` は `JsonObject | FormData`。アイコンなどの upload を含む場合は multipart を使う。Guild、Channel、Event、Invite、role、audit log、message 検索の完全な request field は公開契約として確認できていないため、SDK は `JsonObject` を透過送信する。

## Channel endpoint

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| PATCH | `/channels/{channelId}` | ユーザー | `JsonObject` | `{ channel: GuildChannel }` | Channel 更新 |
| DELETE | `/channels/{channelId}` | ユーザー | なし | `MessageEnvelope` | Channel 削除 |
| PUT | `/channels/{channelId}/permissions/{targetId}/{permission}` | ユーザー | `JsonObject` | `MessageEnvelope` | 対象の権限上書き |
| POST | `/channels/{channelId}/voice/join` | ユーザー | なし | `JsonObject` | Voice 参加情報 |
| POST | `/channels/{channelId}/voice/leave` | ユーザー | なし | `MessageEnvelope` | Voice 退出 |
| POST | `/channels/{channelId}/stage` | ユーザー | `JsonObject` | `{ stage: GuildStage }` | Stage 作成 |
| PATCH | `/channels/{channelId}/stage` | ユーザー | `JsonObject` | `{ stage: GuildStage }` | Stage 更新 |
| DELETE | `/channels/{channelId}/stage` | ユーザー | なし | `MessageEnvelope` | Stage 削除 |
| PATCH | `/channels/{channelId}/stage/me` | ユーザー | `JsonObject` | `MessageEnvelope` | 自分の Stage state 更新 |
| PATCH | `/channels/{channelId}/stage/participants/{userId}` | ユーザー | `JsonObject` | `MessageEnvelope` | 参加者の Stage state 更新 |
| GET | `/channels/{channelId}/forum-posts` | ユーザー | Query: `Pagination` | `{ posts: GuildForumPost[] }` | Forum 一覧 |
| POST | `/channels/{channelId}/forum-posts` | ユーザー | `GuildMessageForm` | `{ post: GuildForumPost }` | Forum 作成 |
| GET | `/channels/{channelId}/forum-posts/{postId}` | ユーザー | なし | `{ post: GuildForumPost }` | Forum 詳細 |
| POST | `/channels/{channelId}/forum-posts/{postId}/replies` | ユーザー | `GuildMessageForm` | `{ message: GuildMessage }` | Forum 返信 |
| GET | `/channels/{channelId}/messages` | ユーザー | Query: `Pagination` | `{ messages: GuildMessage[] }` | Message 一覧 |
| POST | `/channels/{channelId}/messages` | ユーザー | `GuildMessageForm` | `{ message: GuildMessage }` | Message 送信 |
| PATCH | `/channels/messages/{messageId}` | ユーザー | `JsonObject` | `{ message: GuildMessage }` | Message 更新 |
| DELETE | `/channels/messages/{messageId}` | ユーザー | なし | `MessageEnvelope` | Message 削除 |
| POST | `/channels/messages/{messageId}/reactions` | ユーザー | `{ emoji: ReactionCode }` | `MessageEnvelope` | Reaction 追加。`pro:*` は Pro 限定 |

`GuildMessageForm` は `JsonObject | FormData`。添付を含む場合は multipart。Forum と Message の完全な field set は SPA の非公開実装に依存するため、現行 SDK は固定 schema を課さない。

## Bot Application 管理

これはユーザーが Bot Application と token を管理する API。Bot token 自体ではなくユーザー認証を使う。

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/guild-bots/applications` | ユーザー | なし | `{ applications: GuildBotApplication[] }` | Application 一覧 |
| POST | `/guild-bots/applications` | ユーザー | `JsonObject` | `{ application: GuildBotApplication, token?: string }` | Application 作成・初回 token 発行 |
| DELETE | `/guild-bots/applications/{id}` | ユーザー | なし | `MessageEnvelope` | Application 削除 |
| POST | `/guild-bots/applications/{id}/token` | ユーザー | なし | `{ token: string }` | token 再生成 |

token は作成時または再生成時だけ返る可能性がある。平文 token をログやクライアント配布物へ保存しない。再生成すると旧 token は利用不能になる前提で切り替える。

## Bot Token API

すべて `Authorization: Bot <token>` を送る。ユーザー session refresh は行わない。token がない場合、SDK は request 前に `ValidationError` を投げる。

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/developer/guilds` | Bot Token | なし | `{ guilds: Guild[] }` | Bot 導入済み Guild |
| GET | `/developer/guilds/{guildId}/channels` | Bot Token | なし | `{ channels: GuildChannel[] }` | Bot が閲覧可能な Channel |
| POST | `/developer/channels/{channelId}/messages` | Bot Token | `{ content: string }` | `{ message: GuildMessage }` | Bot Message 送信 |
| POST | `/developer/applications/commands` | Bot Token | `BotCommandInput` | `{ command: GuildApplicationCommand }` | Slash Command upsert |
| PUT | `/developer/applications/commands/{commandId}/permissions` | Bot Token | `BotCommandPermissionsInput` | `{ command: GuildApplicationCommand }` | Guild 単位の権限置換 |

```ts
interface BotCommandInput {
  name: string;
  description: string;
  guildId?: number;
  defaultMemberPermissions?: string;
  payload?: JsonObject;
}

interface BotCommandPermissionsInput {
  guildId: number;
  permissions: GuildCommandPermission[];
}

interface GuildCommandPermission {
  id: number;
  type: "ROLE" | "USER" | "CHANNEL";
  permission: boolean;
}
```

## Response schema

```ts
interface Guild {
  id: number;
  name: string;
  [extra: string]: unknown;
}

interface GuildChannel {
  id: number;
  guildId?: number;
  name?: string;
  type?: string;
  [extra: string]: unknown;
}

interface GuildMember {
  user?: User;
  userId?: number;
  nick?: string | null;
  roles?: number[];
  [extra: string]: unknown;
}

interface GuildRole {
  id: number;
  name: string;
  [extra: string]: unknown;
}
```

`GuildInvite`、`GuildEvent`、`GuildBan`、`GuildMessage`、`GuildForumPost`、`GuildStage`、`GuildVoiceState`、Bot 関連 schema は [データスキーマ](./14-schemas.md) を参照。

## Realtime

Guild/Channel の Message、Forum、typing、member、invite、event、voice state、Channel 作成・更新・削除は Socket.IO event でも配信される。event 名と payload は [Realtime API](./13-realtime.md) に列挙する。
