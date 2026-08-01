# API Keys・Developer REST・Twitter v2 互換 API

外部アプリ向け API を扱う。通常のユーザー session API と異なり、Developer REST は API key の scope と rate limit で制御される。

## API key の認証

Developer endpoint では次のいずれかを送る。

```http
x-api-key: <api-key>
```

```http
Authorization: Bearer <api-key>
```

ユーザー access token と同じ Bearer scheme を使えるため、token の種別を混同しない。API key request では session の refresh 処理を使わない。key に許可されていない操作は 403 になる。

## API key 管理 endpoint

この 4 endpoint 自体はユーザー認証を使う。

| Method | Path | Request | Response | 説明 |
|---|---|---|---|---|
| GET | `/apikeys` | なし | `{ apiKeys: ApiKey[] }` | 一覧 |
| POST | `/apikeys` | `ApiKeyCreateInput` | `{ apiKey: ApiKey & { key: string } }` | 作成 |
| DELETE | `/apikeys/{id}` | なし | `MessageEnvelope` | Revoke |
| POST | `/apikeys/{id}/regenerate` | なし | `{ apiKey: ApiKey & { key: string } }` | key 再生成 |

```ts
interface ApiKeyCreateInput {
  name: string;
  canReadPosts?: boolean;
  canCreatePosts?: boolean;
  canReadTimeline?: boolean;
  canReadFollows?: boolean;
  canWriteFollows?: boolean;
  requestsPerMinute?: number;
}

interface ApiKey {
  id: number;
  name: string;
  prefix: string;
  canReadPosts?: boolean;
  canCreatePosts?: boolean;
  canReadTimeline?: boolean;
  canReadFollows?: boolean;
  canWriteFollows?: boolean;
  requestsPerMinute?: number;
  createdAt: string;
  [extra: string]: unknown;
}
```

平文 `key` は作成・再生成 response にだけ含まれる。保存後に再取得できる前提を置かない。

## Developer REST

### User・Timeline・Search

| Method | Path | 主な scope | Request | Response |
|---|---|---|---|---|
| GET | `/developer/users/me` | 認証 | なし | `User` |
| GET | `/developer/timeline` | `canReadTimeline` | Query: `DeveloperListQuery` | `{ posts: Post[], hasMore: boolean }` |
| GET | `/developer/search` | `canReadPosts` | Query: `DeveloperSearchQuery` | `DeveloperSearchResult` |
| GET | `/developer/users/{id}` | Read | なし | `{ user: User }` |
| GET | `/developer/users/by/username/{username}` | Read | なし | `{ user: User }` |
| GET | `/developer/users/{id}/followers` | `canReadFollows` | Query: `CursorPagination` | `{ users: User[], pagination?: PageInfo }` |
| GET | `/developer/users/{id}/following` | `canReadFollows` | Query: `CursorPagination` | `{ users: User[], pagination?: PageInfo }` |
| POST | `/developer/users/{id}/follow` | `canWriteFollows` | なし | `{ following: boolean, pending?: boolean, message?: string }` |
| DELETE | `/developer/users/{id}/follow` | `canWriteFollows` | なし | `{ following: boolean, message?: string }` |
| GET | `/developer/follows/{username}` | `canReadFollows` | なし | `JsonObject` |
| GET | `/developer/follow-requests` | Follow | なし | `{ requests: DeveloperFollowRequest[] }` |
| POST | `/developer/follow-requests/{requestId}/accept` | Follow | なし | `MessageEnvelope` |
| POST | `/developer/follow-requests/{requestId}/reject` | Follow | なし | `MessageEnvelope` |

```ts
interface DeveloperListQuery {
  page?: number;
  limit?: number;
}

interface DeveloperSearchQuery {
  q: string;
  page?: number;
  type?: "posts" | "users" | "hashtags";
  limit?: number;
  cursor?: string;
}

interface DeveloperSearchResult {
  type: "posts" | "users" | "hashtags";
  results: Array<Post | User | Hashtag>;
  pagination?: PageInfo;
}
```

### Posts・Bookmarks

| Method | Path | 主な scope | Request | Response |
|---|---|---|---|---|
| GET | `/developer/posts` | `canReadPosts` | Query: `{ page?, limit?, userId? }` | `{ posts: Post[], hasMore?: boolean, pagination?: PageInfo }` |
| POST | `/developer/posts` | `canCreatePosts` | `multipart/form-data`: `DeveloperPostCreateForm` | `{ post: Post }` |
| GET | `/developer/posts/{postId}` | `canReadPosts` | なし | `{ post: Post }` |
| GET | `/developer/posts/{postId}/replies` | `canReadPosts` | Query: `DeveloperListQuery` | `{ replies: Post[], hasMore?: boolean, pagination?: PageInfo }` |
| GET | `/developer/posts/{postId}/quotes` | `canReadPosts` | Query: `DeveloperListQuery` | `{ quotes: Post[], hasMore?: boolean, pagination?: PageInfo }` |
| PATCH | `/developer/posts/{postId}` | `canCreatePosts` | `DeveloperPostUpdateInput` | `{ message: string, post: Post }` |
| DELETE | `/developer/posts/{postId}` | `canCreatePosts` | なし | `MessageEnvelope` |
| POST | `/developer/posts/{postId}/like` | Write | なし | `MessageEnvelope` |
| DELETE | `/developer/posts/{postId}/like` | Write | なし | `MessageEnvelope` |
| POST | `/developer/posts/{postId}/bookmark` | Write | なし | `MessageEnvelope` |
| DELETE | `/developer/posts/{postId}/bookmark` | Write | なし | `MessageEnvelope` |
| PUT | `/developer/posts/{postId}/bookmark-folders` | Write | `{ folderIds: (number|string)[] }` | `MessageEnvelope` |
| POST | `/developer/posts/{postId}/rekarot` | Write | なし | `MessageEnvelope` |
| DELETE | `/developer/posts/{postId}/rekarot` | Write | なし | `MessageEnvelope` |
| GET | `/developer/posts/{postId}/reactions` | `canReadPosts` | なし | `{ reactions: DeveloperReactionSummary[] }` |
| POST | `/developer/posts/{postId}/react` | `canCreatePosts` | `{ emoji: ReactionCode }` | `MessageEnvelope` |
| DELETE | `/developer/posts/{postId}/react/{emoji}` | `canCreatePosts` | なし | `MessageEnvelope` |
| GET | `/developer/bookmarks` | Read | Query: `{ page?, limit?, folderId? }` | `{ posts: Post[], hasMore?: boolean, pagination?: PageInfo }` |

`DeveloperPostCreateForm`:

| Form field | 型 | 必須 |
|---|---|---:|
| `content` | string | はい |
| `parentId` | number/string | いいえ |
| `quotedPostId` | number/string | いいえ |
| `visibility` | `public` / `followers` / `circle` / `mutual` | いいえ |
| `media` | File/Blob[] | いいえ |
| `pollOptions` | JSON 化した `string[]` | いいえ |
| `pollDurationHours` | number | いいえ |
| `minimumAge` | number | いいえ |
| `maximumAge` | number | いいえ |
| `isR18` | boolean string | いいえ |

```ts
interface DeveloperPostUpdateInput {
  content?: string;
  visibility?: string;
  viewerCircleId?: number | string;
  replyRestriction?: string;
  replyCircleId?: number | string;
  isR18?: boolean;
  hideFromMinors?: boolean;
  isAiGenerated?: boolean;
  isPromotional?: boolean;
  mediaSpoilerFlags?: boolean[];
  mediaR18Flags?: boolean[];
}

interface DeveloperReactionSummary {
  emoji: ReactionCode;
  count: number;
  reacted: boolean;
}
```

通常の投稿 API は大文字の `PUBLIC` などを使うが、Developer 作成 payload の確認済み値は小文字。相互に流用しない。

### News・Stories・Boards

| Method | Path | 主な scope | Request | Response |
|---|---|---|---|---|
| GET | `/developer/news` | `canReadNews` | Query: `DeveloperListQuery` | `{ articles: NewsArticle[], pagination?: PageInfo }` |
| POST | `/developer/news` | `canCreateNews` | `DeveloperNewsCreateInput` | `{ article: NewsArticle }` |
| POST | `/developer/news/uploads` | `canCreateNews` | multipart `media[]` | `JsonObject` |
| GET | `/developer/news/{articleId}` | `canReadNews` | なし | `{ article: NewsArticle }` |
| PUT | `/developer/news/{articleId}` | `canCreateNews` | `Partial<NewsArticleInput>` | `{ article: NewsArticle }` |
| POST | `/developer/news/{articleId}/submit` | `canPublishNews` | なし | `{ article: NewsArticle }` |
| GET | `/developer/stories` | `canReadStories` | なし | `{ stories: Story[] }` |
| GET | `/developer/stories/user/{username}` | `canReadStories` | なし | `{ stories: Story[] }` |
| POST | `/developer/stories/{storyId}/like` | `canWriteStories` | なし | `MessageEnvelope` |
| DELETE | `/developer/stories/{storyId}/like` | `canWriteStories` | なし | `MessageEnvelope` |
| GET | `/developer/stories/{storyId}/comments` | `canReadStories` | なし | `{ comments: StoryComment[] }` |
| POST | `/developer/stories/{storyId}/comments` | `canWriteStories` | `{ content: string }` | `{ comment: StoryComment }` |
| GET | `/developer/boards` | Board | なし | `{ boards: Board[] }` |
| GET | `/developer/boards/{slug}` | Board | Query: `{ limit?: number }` | `{ board: Board, threads: BoardThread[], pagination?: PageInfo }` |
| GET | `/developer/boards/threads/{threadId}` | Board | なし | `{ thread: BoardThread, replies: BoardReply[] }` |
| POST | `/developer/boards/{slug}/threads` | Board | `{ title: string, content: string }` | `{ thread: BoardThread }` |
| POST | `/developer/boards/threads/{threadId}/replies` | Board | `{ content: string }` | `{ reply: BoardReply }` |
| POST | `/developer/boards/threads/{threadId}/react` | Board | `{ emoji: ReactionCode }` | `MessageEnvelope` |
| POST | `/developer/boards/replies/{replyId}/react` | Board | `{ emoji: ReactionCode }` | `MessageEnvelope` |

`DeveloperNewsCreateInput` は `NewsArticleInput` と同じだが `category` が必須。

### DM・Notifications

| Method | Path | 主な scope | Request | Response |
|---|---|---|---|---|
| GET | `/developer/dm/groups` | `canReadDm` | Query: `DeveloperListQuery` | `{ groups: DmGroup[], pagination?: PageInfo }` |
| GET | `/developer/dm/groups/{groupId}/messages` | `canReadDm` | Query: `CursorPagination` | `{ messages: DmMessage[], pagination?: PageInfo }` |
| POST | `/developer/dm/groups/{groupId}/messages` | `canWriteDm` | `{ content: string }` | `{ message: DmMessage }` |
| POST | `/developer/dm/groups/{groupId}/messages/images` | `canWriteDm` | `DeveloperDmImagesForm` | `{ message: DmMessage }` |
| POST | `/developer/dm/groups/{groupId}/read` | `canReadDm` | なし | `MessageEnvelope` |
| GET | `/developer/notifications` | Notification | Query: `{ page?, limit?, type? }` | `{ notifications: Notification[], pagination?: PageInfo }` |
| GET | `/developer/notifications/unread/count` | Notification | なし | `{ count: number }` |
| PATCH | `/developer/notifications/{notificationId}/read` | Notification | なし | `MessageEnvelope` |
| PATCH | `/developer/notifications/read-all` | Notification | Query: `{ type?: NotificationType }`、body なし | `MessageEnvelope` |
| DELETE | `/developer/notifications/{notificationId}` | Notification | なし | `MessageEnvelope` |

`DeveloperDmImagesForm`:

| Form field | 型 | 必須 |
|---|---|---:|
| `images` | File/Blob[] | はい |
| `content` | string | いいえ |
| `attachmentAlts` | JSON 化した `string[]` | いいえ |
| `attachmentSpoilerFlags` | JSON 化した `boolean[]` | いいえ |
| `attachmentR18Flags` | JSON 化した `boolean[]` | いいえ |

### Schema・Usage

| Method | Path | Request | Response | 説明 |
|---|---|---|---|---|
| GET | `/developer/schemas/post` | なし | `JsonObject` | Post schema |
| GET | `/developer/schemas/user` | なし | `JsonObject` | User schema |
| GET | `/developer/schemas/poll` | なし | `JsonObject` | Poll schema |
| GET | `/developer/schemas/timeline-item` | なし | `JsonObject` | Timeline item schema |
| GET | `/developer/apikeys` | なし | `{ apiKeys: ApiKey[] }` | 現在の key から見える key 情報 |
| GET | `/developer/usage` | なし | `DeveloperUsage` | 利用量・残量 |

```ts
interface DeveloperUsage {
  requests?: number;
  remaining?: number;
  resetAt?: string;
  byEndpoint?: Record<string, number>;
  [extra: string]: JsonValue;
}
```

## Twitter v2 互換 API

Karotter のデータを Twitter API v2 風の `{ data, meta? }` envelope で返す。Twitter 公式 API と完全互換ではない。未列挙 field、expansion、field selector、pagination の対応範囲は endpoint ごとに異なる。

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/developer/2/users/me` | なし | `{ data: UserV2 }` |
| GET | `/developer/2/users/{id}` | なし | `{ data: UserV2 }` |
| GET | `/developer/2/users/by/username/{username}` | なし | `{ data: UserV2 }` |
| GET | `/developer/2/users/{id}/tweets` | Query: `{ max_results?, pagination_token? }` | `{ data: TweetV2[], meta?: TwitterCompatMeta }` |
| GET | `/developer/2/users/{id}/timelines/reverse_chronological` | Query: `{ max_results?, pagination_token? }` | `{ data: TweetV2[], meta?: TwitterCompatMeta }` |
| POST | `/developer/2/tweets` | `{ text: string }` | `{ data: TweetV2 }` |
| GET | `/developer/2/tweets/{id}` | なし | `{ data: TweetV2 }` |
| DELETE | `/developer/2/tweets/{id}` | なし | `{ data: { deleted: boolean } }` |
| GET | `/developer/2/tweets/search/recent` | Query: `{ query: string, max_results?, next_token? }` | `{ data: TweetV2[], meta?: TwitterCompatMeta }` |
| GET | `/developer/2/users/{id}/followers` | なし | `{ data: UserV2[] }` |
| GET | `/developer/2/users/{id}/following` | なし | `{ data: UserV2[] }` |
| POST | `/developer/2/users/{sourceUserId}/following` | `{ target_user_id: string }` | `{ data: { following: boolean, pending_follow?: boolean } }` |
| DELETE | `/developer/2/users/{sourceUserId}/following/{targetUserId}` | なし | `{ data: { following: boolean } }` |
| GET | `/developer/2/tweets/{tweetId}/liking_users` | なし | `{ data: UserV2[] }` |
| GET | `/developer/2/tweets/{tweetId}/retweeted_by` | なし | `{ data: UserV2[] }` |
| GET | `/developer/2/tweets/{tweetId}/quote_tweets` | なし | `{ data: TweetV2[] }` |
| GET | `/developer/2/users/{userId}/liked_tweets` | なし | `{ data: TweetV2[] }` |
| GET | `/developer/2/users/{userId}/bookmarks` | なし | `{ data: TweetV2[] }` |
| POST | `/developer/2/users/{userId}/likes` | `{ tweet_id: string }` | `{ data: { liked: boolean } }` |
| DELETE | `/developer/2/users/{userId}/likes/{tweetId}` | なし | `{ data: { liked: boolean } }` |
| POST | `/developer/2/users/{userId}/retweets` | `{ tweet_id: string }` | `{ data: { retweeted: boolean } }` |
| DELETE | `/developer/2/users/{userId}/retweets/{tweetId}` | なし | `{ data: { retweeted: boolean } }` |
| POST | `/developer/2/users/{userId}/blocking` | `{ target_user_id: string }` | `{ data: { blocking: boolean } }` |
| GET | `/developer/2/users/{userId}/blocking` | なし | `{ data: UserV2[] }` |
| POST | `/developer/2/users/{userId}/muting` | `{ target_user_id: string }` | `{ data: { muting: boolean } }` |
| GET | `/developer/2/users/{userId}/muting` | なし | `{ data: UserV2[] }` |
| GET | `/developer/2/lists` | なし | `{ data: JsonObject[], meta?: TwitterCompatMeta }` |
| GET | `/developer/2/spaces` | なし | `{ data: JsonObject[], meta?: TwitterCompatMeta }` |
| GET | `/developer/2/spaces/search` | Query: `{ query?: string }` | `{ data: JsonObject[], meta?: TwitterCompatMeta }` |

```ts
interface TweetV2 {
  id: string;
  text: string;
  author_id?: string;
  created_at?: string;
  conversation_id?: string;
  in_reply_to_user_id?: string;
  attachments?: { media_keys?: string[] };
  [extra: string]: JsonValue;
}

interface UserV2 {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
  description?: string;
  [extra: string]: JsonValue;
}

interface TwitterCompatMeta {
  result_count?: number;
  next_token?: string;
  previous_token?: string;
  [extra: string]: JsonValue;
}
```
