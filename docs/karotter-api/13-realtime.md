# Realtime API

Karotter の Realtime API は Socket.IO を使う。既定 URL は `https://api.karotter.com`、transport は WebSocket。DM、通話、Radio、Draw、Guild、Channel、通知、オンライン状態を配信する。

## Connection

```ts
const socket = io("https://api.karotter.com", {
  auth: { token: accessToken },
  withCredentials: true,
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: Number.POSITIVE_INFINITY,
  reconnectionDelay: 1_000,
  reconnectionDelayMax: 8_000,
  timeout: 20_000,
});
```

| Option | 既定値 | 説明 |
|---|---:|---|
| `url` | REST base URL | Socket.IO server URL |
| `auth.token` | 現在の user access token | handshake 認証 |
| `withCredentials` | `true` | Cookie 送信 |
| `transports` | `["websocket"]` | transport |
| `reconnection` | `true` | 自動再接続 |
| `reconnectionAttempts` | `Infinity` | 再接続回数 |
| `reconnectionDelay` | `1000` ms | 初期遅延 |
| `reconnectionDelayMax` | `8000` ms | 最大遅延 |
| `timeout` | `20000` ms | 接続 timeout |

access token 更新後は既存 handshake の token が変わらないため `reconnect()` する。`connect_error` で認証失敗した場合も、REST refresh 後に明示的に再接続する。

## Socket lifecycle event

| Event | Direction | Payload |
|---|---|---|
| `connect` | Server → Client | なし |
| `disconnect` | Server → Client | Socket.IO reason |
| `connect_error` | Server → Client | Error |
| `notification` | Server → Client | `NotificationEventPayload` |

## DM event

| Event | Direction | Payload |
|---|---|---|
| `dm:join` | Client → Server | `{ groupId: number }` |
| `dm:leave` | Client → Server | `{ groupId: number }` |
| `dm:read` | Client → Server | `{ groupId: number, messageId: number }` |
| `dm:new-message` | Server → Client | `DmMessagePayload` |
| `dm:message-deleted` | Server → Client | `DmMessageDeletedPayload` |
| `dm:message-updated` | Server → Client | `DmMessagePayload` |
| `dm:member-added` | Server → Client | `DmGroupEventPayload` |
| `dm:member-left` | Server → Client | `DmGroupEventPayload` |
| `dm:member-removed` | Server → Client | `DmGroupEventPayload` |
| `dm:request-updated` | Server → Client | `DmRequestUpdatedPayload` |

```ts
interface DmMessagePayload {
  groupId: number;
  message: DmMessage;
}

interface DmMessageDeletedPayload {
  groupId: number;
  messageId: number;
}

interface DmGroupEventPayload {
  groupId: number;
  user?: User;
  member?: User;
  message?: DmMessage;
  [extra: string]: unknown;
}

interface DmRequestUpdatedPayload {
  groupId: number;
  status?: string;
  requesterId?: number;
  targetUserId?: number;
  [extra: string]: unknown;
}
```

## Typing・User status

| Event | Direction | Payload |
|---|---|---|
| `typing:start` | Client → Server | `{ groupId: number }` |
| `typing:stop` | Client → Server | `{ groupId: number }` |
| `typing:user` | Server → Client | `TypingPayload` |
| `typing:stop` | Server → Client | `TypingPayload` |
| `user:status` | Server → Client | `UserStatusPayload` |

```ts
interface TypingPayload {
  groupId: number;
  userId?: number;
  username?: string;
  displayName?: string;
  user?: User;
}

interface UserStatusPayload {
  userId: number;
  status: "ONLINE" | "OFFLINE" | "INVISIBLE" | string;
  statusMessage?: string | null;
  lastSeenAt?: string | null;
}
```

`typing:stop` は同じ event 名を client emit と server notification の両方向で使う。

## Call・Voice signaling

| Event | Direction | Payload |
|---|---|---|
| `call:incoming` | Server → Client | `CallIncomingPayload` |
| `call:state` | Server → Client | `CallStatePayload` |
| `voice:offer` | 双方向 | `RealtimeSignalPayload` |
| `voice:answer` | 双方向 | `RealtimeSignalPayload` |
| `voice:ice-candidate` | 双方向 | `RealtimeSignalPayload` |
| `voice:hangup` | Client → Server | `{ groupId?: number, targetUserId?: number }` |
| `voice:hangup` | Server → Client | `{ groupId?: number, userId?: number }` |
| `voice:participant-state` | 双方向 | `ParticipantStatePayload` |
| `screen-share:view` | Client → Server | `ScreenShareViewPayload` |

```ts
interface CallIncomingPayload {
  groupId: number;
  callId?: string;
  caller?: User;
  callerId?: number;
  [extra: string]: unknown;
}

interface CallStatePayload {
  groupId?: number;
  callId?: string;
  state: string;
  userId?: number;
  [extra: string]: unknown;
}

interface RealtimeSignalPayload {
  targetUserId?: number;
  fromUserId?: number;
  roomId?: string | number;
  spaceId?: number;
  groupId?: number;
  sdp?: string;
  candidate?: RTCIceCandidateInit | JsonObject;
  type?: string;
  [extra: string]: unknown;
}

interface ParticipantStatePayload {
  userId: number;
  muted?: boolean;
  speaking?: boolean;
  screenSharing?: boolean;
  role?: string;
  [extra: string]: unknown;
}

interface ScreenShareViewPayload {
  roomId?: string | number;
  userId?: number;
  viewing: boolean;
}
```

signaling payload は room 種別により `groupId`、`spaceId`、`roomId` のいずれかを使う。offer/answer の SDP は `sdp`、ICE candidate は `candidate`。

## Radio event

| Event | Direction | Payload |
|---|---|---|
| `radio:signal` | 双方向 | `RealtimeSignalPayload` |
| `radio:renegotiate-request` | Client → Server | `RealtimeSignalPayload` |
| `radio:participant-state` | 双方向 | `ParticipantStatePayload` |
| `radio:message` | Client → Server | `{ spaceId: number, content: string }` |
| `radio:message` | Server → Client | `RadioMessagePayload` |
| `radio:reaction` | Client → Server | `{ spaceId: number, emoji: string }` |
| `radio:reaction` | Server → Client | `RadioReactionPayload` |
| `radio:user-joined` | Server → Client | `RadioUserPayload` |
| `radio:user-left` | Server → Client | `RadioUserPayload` |
| `radio:ended` | Server → Client | `RadioEndedPayload` |
| `radio:host-disconnected` | Server → Client | `RadioHostPayload` |
| `radio:host-reconnected` | Server → Client | `RadioHostPayload` |

`radio:join` と `radio:leave` は event 名として定義されているが、現行の型付き Client/Server map には payload contract が登録されていない。参加・退出には REST の `/radio/{id}/join` と `/radio/{id}/leave` を使う。

```ts
interface RadioUserPayload {
  spaceId: number;
  userId: number;
  user?: User;
  participant?: RadioParticipant;
  participantsCount?: number;
  [extra: string]: unknown;
}

interface RadioEndedPayload {
  spaceId: number;
  endedAt?: string;
  reason?: string;
}

interface RadioHostPayload {
  spaceId: number;
  hostId: number;
}

interface RadioMessagePayload {
  spaceId: number;
  message: RadioMessage;
}

interface RadioReactionPayload {
  spaceId: number;
  userId?: number;
  user?: User;
  emoji: string;
  [extra: string]: unknown;
}
```

## Draw event

| Event | Direction | Payload |
|---|---|---|
| `draw:join` | Client → Server | `{ roomId: string, inviteCode?: string }` |
| `draw:leave` | Client → Server | `{ roomId: string }` |
| `draw:room-state` | Server → Client | `DrawRoomStatePayload` |
| `draw:layer-sync` | 双方向 | `DrawLayerSyncPayload` |
| `draw:stroke` | 双方向 | `DrawStrokePayload` |
| `draw:cursor` | 双方向 | `DrawCursorPayload` |
| `draw:chat` | Client → Server | `{ roomId: string, content: string }` |
| `draw:chat` | Server → Client | `DrawChatPayload` |
| `draw:user-left` | Server → Client | `{ roomId: string, userId: number }` |
| `draw:error` | Server → Client | `DrawErrorPayload` |

```ts
interface DrawRoomStatePayload {
  roomId: string;
  room?: DrawRoom;
  users?: User[];
  layers?: DrawLayer[];
  [extra: string]: unknown;
}

interface DrawLayerSyncPayload {
  roomId: string;
  layers: DrawLayer[];
  fullSync?: boolean;
  revision?: number;
  clientId?: string;
  broadcast?: boolean;
}

interface DrawStrokePayload {
  roomId: string;
  id?: string;
  layerId?: string;
  userId?: number;
  username?: string;
  clientId?: string;
  points?: DrawStrokePoint[];
  stroke?: DrawStroke;
  color?: string;
  secondaryColor?: string;
  size?: number;
  opacity?: number;
  drawing?: boolean;
  [extra: string]: unknown;
}

interface DrawCursorPayload {
  roomId: string;
  userId?: number;
  username?: string;
  clientId?: string;
  x: number;
  y: number;
  drawing?: boolean;
}

interface DrawChatPayload {
  roomId: string;
  userId: number;
  content: string;
  user?: User;
  createdAt?: string;
}

interface DrawErrorPayload {
  message: string;
  code?: string;
  roomId?: string;
}
```

## Guild・Channel event

| Event | Direction | Payload |
|---|---|---|
| `guild:join` | Client → Server | `{ guildId: number }` |
| `guild:leave` | Client → Server | `{ guildId: number }` |
| `guild:typing:start` | Client → Server | `{ guildId: number, channelId: number }` |
| `channel:join` | Client → Server | `{ channelId: number }` |
| `channel:leave` | Client → Server | `{ channelId: number }` |
| `guild:message-create` | Server → Client | `GuildMessagePayload` |
| `guild:message-update` | Server → Client | `GuildMessagePayload` |
| `guild:message-delete` | Server → Client | `GuildMessageDeletedPayload` |
| `guild:forum-post-create` | Server → Client | `GuildResourcePayload` |
| `guild:forum-post-update` | Server → Client | `GuildResourcePayload` |
| `guild:forum-post-delete` | Server → Client | `GuildResourcePayload` |
| `guild:typing:user` | Server → Client | `GuildTypingPayload` |
| `guild:member-joined` | Server → Client | `GuildResourcePayload` |
| `guild:member-removed` | Server → Client | `GuildResourcePayload` |
| `guild:invites-updated` | Server → Client | `GuildResourcePayload` |
| `guild:event-created` | Server → Client | `GuildResourcePayload` |
| `guild:event-updated` | Server → Client | `GuildResourcePayload` |
| `guild:event-deleted` | Server → Client | `GuildResourcePayload` |
| `guild:voice-state-updated` | Server → Client | `GuildResourcePayload` |
| `channel:created` | Server → Client | `GuildResourcePayload` |
| `channel:updated` | Server → Client | `GuildResourcePayload` |
| `channel:deleted` | Server → Client | `GuildResourcePayload` |

```ts
interface GuildMessagePayload {
  channelId: number;
  message: GuildMessage;
}

interface GuildMessageDeletedPayload {
  channelId: number;
  messageId: number;
}

interface GuildTypingPayload {
  guildId?: number;
  channelId: number;
  userId?: number;
  username?: string;
}

interface GuildResourcePayload {
  guildId?: number;
  channelId?: number;
  channel?: GuildChannel;
  forumPost?: GuildForumPost;
  member?: GuildMember;
  event?: GuildEvent;
  voiceState?: GuildVoiceState;
  [extra: string]: unknown;
}
```

## Notification payload

```ts
interface NotificationEventPayload {
  type: string;
  actor?: User;
  post?: Post;
  message?: string;
  [extra: string]: unknown;
}
```

REST の `Notification` object とは envelope が異なる。`notification` event で `id` や `readAt` が必ず存在する前提を置かない。

## Reconnection and state recovery

Socket.IO の再接続は event の欠落を埋めない。再接続後は対象の REST endpoint から状態を再取得する。

- DM: group message cursor、未読数、active call。
- Radio: space、participant、message。
- Draw: room state と layer revision。
- Guild: channel message、forum、voice state。
- Notifications: cursor と未読数。

同じ event が再送される可能性を考慮し、`messageId`、resource ID、revision で冪等に反映する。
