# Radio・Draw・News・Boards API

音声スペース、共同描画、記事、掲示板を扱う。Realtime payload は [Realtime API](./13-realtime.md) を参照。

## Radio / Spaces

### Endpoint

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/radio/active` | 不要 | なし | `{ spaces: RadioSpace[], pagination?: PageInfo }` | 配信中一覧 |
| GET | `/radio/me` | 必須 | なし | `{ spaces: RadioSpace[], pagination?: PageInfo }` | 自分の space |
| GET | `/radio/upcoming` | 不要 | なし | `{ spaces: RadioSpace[], pagination?: PageInfo }` | 予定一覧 |
| GET | `/radio/ice-servers` | 必須 | なし | `{ iceServers: IceServer[] }` | WebRTC ICE 設定 |
| POST | `/radio` | 必須 | `RadioCreateInput` | `{ space: RadioSpace }` | 作成 |
| GET | `/radio/{id}` | 任意 | なし | `{ space: RadioSpace }` | 取得 |
| GET | `/radio/{id}/messages` | 任意 | Query: `Pagination` | `{ messages: RadioMessage[], pagination?: PageInfo }` | Chat 一覧 |
| POST | `/radio/{id}/messages` | 必須 | `{ content: string }` | `{ message: RadioMessage }` | Chat 送信 |
| POST | `/radio/{id}/join` | 必須 | なし | `MessageEnvelope` | 参加 |
| POST | `/radio/{id}/leave` | 必須 | なし | `MessageEnvelope` | 退出 |
| POST | `/radio/{id}/end` | 必須 | なし | `MessageEnvelope` | 終了 |
| POST | `/radio/{id}/request-speaker` | 必須 | なし | `MessageEnvelope` | Speaker 申請 |
| POST | `/radio/{id}/accept-speaker-invite` | 必須 | なし | `MessageEnvelope` | Speaker 招待承認 |
| POST | `/radio/{id}/participants/{participantId}/invite-speaker` | 必須 | なし | `MessageEnvelope` | Speaker 招待 |
| DELETE | `/radio/{id}/participants/{participantId}/invite-speaker` | 必須 | なし | `MessageEnvelope` | 招待取消 |
| PATCH | `/radio/{id}/participants/{participantId}/mute` | 必須 | `{ isMuted: boolean }` | `MessageEnvelope` | mute 状態変更 |
| PATCH | `/radio/{id}/participants/{participantId}/role` | 必須 | `{ role: RadioRole }` | `MessageEnvelope` | role 変更 |
| POST | `/radio/{id}/participants/{participantId}/transfer-host` | 必須 | なし | `MessageEnvelope` | Host 移譲 |
| PATCH | `/radio/{id}/settings` | 必須 | `RadioSettings` | `{ space: RadioSpace }` | 設定更新 |
| GET | `/radio/{id}/realtime-token` | 必須 | なし | `{ token: string, url?: string }` | Realtime token |

```ts
interface RadioCreateInput {
  title: string;
  description?: string | null;
  mode?: "PUBLIC" | "FOLLOWERS_ONLY" | "INVITE_ONLY" | string;
  speakerPermission?:
    | "FOLLOWING_ONLY"
    | "EVERYONE"
    | "INVITED_ONLY"
    | string;
}

interface RadioSettings {
  recordingEnabled?: boolean;
  reactionsEnabled?: boolean;
  chatEnabled?: boolean;
  speakerApprovalRequired?: boolean;
  maxSpeakers?: number;
  [extra: string]: unknown;
}

type RadioRole = "HOST" | "SPEAKER" | "LISTENER" | string;
```

mute payload の field は `isMuted`。旧 SPA 調査の `muted` ではない。Realtime token は短命である可能性があるため、接続直前に取得する。

## Draw

### Endpoint

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/draw/rooms` | 不要 | Query: `Pagination` | `{ rooms: DrawRoom[] }` | 公開 room 一覧 |
| GET | `/draw/rooms/me` | 必須 | なし | `{ rooms: DrawRoom[] }` | 自分の room |
| POST | `/draw/rooms` | 必須 | `DrawRoomCreateInput` | `{ room: DrawRoom }` | 作成 |
| GET | `/draw/rooms/{roomId}` | 任意 | なし | `{ room: DrawRoom }` | 取得 |
| DELETE | `/draw/rooms/{roomId}` | 必須 | なし | `MessageEnvelope` | 削除 |
| POST | `/draw/rooms/{roomId}/join` | 任意 | `{ inviteCode?: string }`。未指定時 `{}` | `MessageEnvelope` | 参加 |
| POST | `/draw/rooms/{roomId}/chat` | 必須 | `{ content: string }` | `MessageEnvelope` | Chat 送信 |
| POST | `/draw/rooms/{roomId}/invite/rotate` | 必須 | なし | `{ inviteCode: string }` | Invite code 更新 |
| PUT | `/draw/rooms/{roomId}/layers` | 必須 | `DrawLayers` | `MessageEnvelope` | Layer 全体を同期 |
| GET | `/draw/rooms/{roomId}/realtime-token` | 必須 | なし | `{ token: string, url?: string }` | Realtime token |

```ts
interface DrawRoomCreateInput {
  name: string;
  isPrivate?: boolean;
  capacity?: number;
}

type DrawLayers = DrawLayer[];

interface DrawLayer {
  id: string;
  name?: string;
  visible?: boolean;
  locked?: boolean;
  opacity?: number;
  dataUrl?: string;
  strokes?: DrawStroke[];
  [extra: string]: unknown;
}
```

作成 field は `name`。旧 SPA 調査の `title` / `description` ではない。`PUT /layers` は差分 stroke ではなく layer 配列全体を送る。高頻度の stroke・cursor 同期は REST ではなく Realtime event を使う。

## News

### Endpoint

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/news` | 不要 | Query: `NewsListQuery` | `NewsListResponse` | Article 一覧 |
| GET | `/news/me` | 必須 | なし | `NewsListResponse` | 自分の記事 |
| GET | `/news/{slugOrId}` | 不要 | なし | `{ article: NewsArticle }` | Article 取得 |
| POST | `/news` | 必須 | `NewsArticleInput` または `FormData` | `{ article: NewsArticle }` | 作成 |
| PUT | `/news/{slugOrId}` | 必須 | `Partial<NewsArticleInput>` または `FormData` | `{ article: NewsArticle }` | 更新 |
| DELETE | `/news/{slugOrId}` | 必須 | なし | `MessageEnvelope` | 削除 |
| POST | `/news/{slugOrId}/submit` | 必須 | なし | `{ article: NewsArticle }` | Review 提出 |
| POST | `/news/{id}/like` | 必須 | なし | `MessageEnvelope` | いいね |
| DELETE | `/news/{id}/like` | 必須 | なし | `MessageEnvelope` | いいね解除 |
| GET | `/news/{id}/comments` | 不要 | なし | `NewsCommentsResponse` | Comment 一覧 |
| POST | `/news/{id}/comments` | 必須 | `{ content: string }` | `{ comment: NewsComment }` | Comment 作成 |
| PATCH | `/news/{id}/comments/{commentId}` | 必須 | `{ content: string }` | `{ comment: NewsComment }` | Comment 編集 |
| DELETE | `/news/{id}/comments/{commentId}` | 必須 | なし | `MessageEnvelope` | Comment 削除 |
| POST | `/news/uploads` | 必須 | `multipart/form-data` | `{ url: string }` | 画像 upload |
| GET | `/news/admin/list` | 管理者 | Query: `Pagination` | `NewsListResponse` | Review 対象一覧 |
| PATCH | `/news/admin/{id}/review` | 管理者 | `{ status: string, reason?: string }` | `{ article: NewsArticle }` | Review 判定 |

```ts
interface NewsListQuery extends Pagination {
  category?: string;
}

interface NewsArticleInput {
  title: string;
  body: string;
  category?: string;
  summary?: string;
  slug?: string;
  coverImageUrl?: string | null;
  status?: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | string;
}

interface NewsListResponse {
  articles: NewsArticle[];
  pagination?: PageInfo;
}

interface NewsCommentsResponse {
  comments: NewsComment[];
  pagination?: PageInfo;
}
```

画像を別 upload して `coverImageUrl` を JSON に入れる方法と、記事 FormData に画像を含める方法の両方を SDK は許容する。管理 review の status 列挙はサーバー運用に依存するため固定しない。

## Boards

### Endpoint

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/boards` | 不要 | なし | `BoardsResponse` | Board 一覧 |
| POST | `/boards` | 必須 | `BoardCreateInput` | `{ board: Board }` | Board 作成 |
| DELETE | `/boards/{slug}` | 必須 | なし | `MessageEnvelope` | Board 削除 |
| GET | `/boards/following` | 必須 | なし | `BoardsResponse` | Follow 中 Board |
| GET | `/boards/{slug}` | 不要 | なし | `BoardResponse` | Board と Thread 一覧 |
| POST | `/boards/{slug}/follow` | 必須 | なし | `MessageEnvelope` | Board follow |
| DELETE | `/boards/{slug}/follow` | 必須 | なし | `MessageEnvelope` | Board unfollow |
| POST | `/boards/{slug}/threads` | 必須 | `multipart/form-data`: `BoardThreadForm` | `{ thread: BoardThread }` | Thread 作成 |
| GET | `/boards/{slug}/threads/{threadId}` | 不要 | なし | `BoardThreadResponse` | Thread と Reply 取得 |
| DELETE | `/boards/{slug}/threads/{threadId}` | 必須 | なし | `MessageEnvelope` | Thread 削除 |
| POST | `/boards/{slug}/threads/{threadId}/follow` | 必須 | なし | `MessageEnvelope` | Thread follow |
| DELETE | `/boards/{slug}/threads/{threadId}/follow` | 必須 | なし | `MessageEnvelope` | Thread unfollow |
| POST | `/boards/{slug}/threads/{threadId}/replies` | 必須 | `multipart/form-data`: `BoardReplyForm` | `{ reply: BoardReply }` | Reply 作成 |
| POST | `/boards/{slug}/threads/{threadId}/reactions` | 必須 | `{ emoji: ReactionCode }` | `MessageEnvelope` | Thread reaction。`pro:*` は Pro 限定 |
| GET | `/boards/{slug}/threads/{threadId}/reactions/{emoji}/users` | 任意 | Query: `Pagination` | `ReactionUsersResponse` | Thread reaction user |
| POST | `/boards/{slug}/replies/{replyId}/reactions` | 必須 | `{ emoji: ReactionCode }` | `MessageEnvelope` | Reply reaction。`pro:*` は Pro 限定 |
| GET | `/boards/{slug}/replies/{replyId}/reactions/{emoji}/users` | 任意 | Query: `Pagination` | `ReactionUsersResponse` | Reply reaction user |

```ts
interface BoardCreateInput {
  name: string;
  slug?: string;
  description?: string;
}

interface BoardThreadForm {
  title: string;
  content: string;
  images?: File[];
}

interface BoardReplyForm {
  content: string;
  images?: File[];
}

interface BoardsResponse {
  boards: Board[];
  pagination?: PageInfo;
}

interface BoardResponse {
  board: Board;
  threads?: BoardThread[];
  pagination?: PageInfo;
}

interface BoardThreadResponse {
  thread: BoardThread;
  replies?: BoardReply[];
  pagination?: PageInfo;
}

interface ReactionUsersResponse {
  emoji: ReactionCode;
  count: number;
  users: User[];
  pagination?: PageInfo;
}
```

Thread/Reply multipart は `title`、`content`、`images` が確認済み。現行 SDK は FormData を透過送信し、追加 field を制限しない。Board SSE URL は `https://api.karotter.com/api/boards/{slug}/stream`。
