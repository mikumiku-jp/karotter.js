# 投稿 API

投稿の作成、取得、フィード、反応、投票、予約投稿、ブックマーク、下書きを扱う。共通の認証、ページング、エラー形式は [共通規約](./01-conventions.md)、`Post` などの共通オブジェクトは [データスキーマ](./14-schemas.md) を参照。

## エンドポイント一覧

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/posts/{id}` | 任意 | Query: `{ includeMutedOrBlocked?: boolean, includeUnavailableReference?: boolean }` | `{ post: Post }` | 投稿取得。公開範囲やブロック状態により 403 |
| POST | `/posts` | 必須 | `multipart/form-data`: `CreatePostForm` | `PostResponse` | 投稿作成 |
| PUT | `/posts/{id}` | 必須 | `multipart/form-data`: `CreatePostForm` | `PostResponse` | 投稿編集 |
| DELETE | `/posts/{id}` | 必須 | なし | `MessageEnvelope` | 投稿削除 |
| GET | `/posts/timeline` | 必須 | Query: `TimelineQuery` | `PostListResponse` | 自分向けタイムライン |
| GET | `/posts/recommended` | 不要 | Query: `RecommendedQuery` | `PostListResponse` | 推奨投稿 |
| GET | `/v2/feed/public` | 不要 | Query: `PublicFeedQuery` | `PostListResponse` | 公開フィード |
| POST | `/v2/feed/views` | 任意 | `{ postIds: number[] }` | `{ recorded: number }` | 公開フィードの閲覧記録 |
| GET | `/posts/trending` | 不要 | なし | `PostListResponse` | トレンド投稿 |
| GET | `/posts/{id}/replies` | 任意 | Query: `Pagination` | `ReplyListResponse` | 返信一覧 |
| GET | `/posts/{id}/quotes` | 任意 | Query: `Pagination` | `QuoteListResponse` | 引用一覧 |
| GET | `/posts/{id}/likes` | 任意 | Query: `Pagination` | `UserListResponse` | いいねしたユーザー |
| GET | `/posts/{id}/rekarots` | 任意 | Query: `Pagination` | `UserListResponse` | リカロートしたユーザー |
| GET | `/posts/{id}/conversation` | 必須 | なし | `ConversationInfo` | 会話参加情報 |
| POST | `/posts/{id}/conversation/leave` | 必須 | なし | `MessageEnvelope` | 会話から離脱 |
| GET | `/posts/{id}/reply-targets` | 必須 | なし | `ReplyTargets` | 返信対象候補 |
| GET | `/posts/{id}/analytics` | 必須 | なし | `PostAnalytics` | 自分の投稿分析 |
| POST | `/posts/{id}/like` | 必須 | なし | `MessageEnvelope` | いいね |
| DELETE | `/posts/{id}/like` | 必須 | なし | `MessageEnvelope` | いいね解除 |
| POST | `/posts/{id}/rekarot` | 必須 | なし | `MessageEnvelope` | リカロート |
| DELETE | `/posts/{id}/rekarot` | 必須 | なし | `MessageEnvelope` | リカロート解除 |
| POST | `/posts/{id}/bookmark` | 必須 | `{ folderIds?: number[] }` または body なし | `MessageEnvelope` | ブックマーク |
| DELETE | `/posts/{id}/bookmark` | 必須 | なし | `MessageEnvelope` | ブックマーク解除 |
| PUT | `/posts/{id}/bookmark-folders` | 必須 | `{ folderIds: number[] }` | `MessageEnvelope` | 保存先フォルダを置換 |
| POST | `/posts/{id}/react` | 必須 | `{ emoji: ReactionCode }` | `MessageEnvelope` | リアクション追加。`pro:*` は Pro 限定 |
| DELETE | `/posts/{id}/react/{emoji}` | 必須 | なし | `MessageEnvelope` | リアクション削除 |
| GET | `/posts/{id}/react/{emoji}/users` | 任意 | Query: `Pagination` | `UserListResponse` | リアクションしたユーザー |
| POST | `/posts/{id}/poll/vote` | 必須 | `{ optionId: number }` | `MessageEnvelope & { poll?: Poll }` | 投票 |
| GET | `/posts/{postId}/poll/options/{optionId}/voters` | 必須 | Query: `Pagination` | `UserListResponse` | 記名投票の投票者 |
| POST | `/posts/batch-views` | 任意 | `{ postIds: number[] }` | `{ recorded: number }` | 投稿閲覧を一括記録 |
| POST | `/posts/feedback/beta-survey` | 必須 | `BetaSurveyInput` | `MessageEnvelope` | フィード比較アンケート |
| POST | `/posts/{id}/translate` | 任意 | `{ targetLocale: string }` | `PostTranslation` | 投稿翻訳 |
| GET | `/posts/scheduled/me` | 必須 | なし | `{ scheduledPosts: ScheduledPost[] }` | 予約投稿一覧 |
| PUT | `/posts/scheduled/{id}` | 必須 | `ScheduledPostUpdateInput` | `{ message?: string, scheduledPost?: ScheduledPost }` | 予約投稿更新 |
| DELETE | `/posts/scheduled/{id}` | 必須 | なし | `MessageEnvelope` | 予約取消 |
| GET | `/posts/me/bookmarks` | 必須 | Query: `BookmarkListQuery` | `PostListResponse` | 自分のブックマーク |
| GET | `/posts/me/bookmark-folders` | 必須 | なし | `{ folders: BookmarkFolder[] }` | フォルダ一覧 |
| POST | `/posts/me/bookmark-folders` | 必須 | `{ name: string }` | `{ folder: BookmarkFolder }` | フォルダ作成 |
| PATCH | `/posts/me/bookmark-folders/{folderId}` | 必須 | `{ name?: string }` | `{ folder: BookmarkFolder }` | フォルダ更新 |
| DELETE | `/posts/me/bookmark-folders/{folderId}` | 必須 | なし | `MessageEnvelope` | フォルダ削除 |
| GET | `/posts/drafts` | 必須 | なし | `{ drafts: PostDraft[] }` | 下書き一覧 |
| POST | `/posts/drafts` | 必須 | `multipart/form-data`: `CreatePostForm` | `{ draft: PostDraft }` | 下書き作成 |
| PUT | `/posts/drafts/{draftId}` | 必須 | `multipart/form-data`: `CreatePostForm` | `{ draft: PostDraft }` | 下書き更新 |
| DELETE | `/posts/drafts/{draftId}` | 必須 | なし | `MessageEnvelope` | 下書き削除 |

## 投稿作成・編集 payload

`POST /posts`、`PUT /posts/{id}`、下書き作成・更新は JSON ではなく `multipart/form-data` を使う。SDK の `CreatePostInput` は次のフィールドへ変換される。

| Form field | 型 | 必須 | 既定値・制約 |
|---|---|---:|---|
| `content` | string | 条件付き | 本文。投稿作成時は本文、メディア、投票のいずれかが必要 |
| `parentId` | number/string | いいえ | 返信先投稿 ID |
| `quotedPostId` | number/string | いいえ | 引用元投稿 ID |
| `questionId` | number/string | いいえ | 回答する質問 ID |
| `excludedMentions` | JSON 化した `number[]` | いいえ | 返信通知・メンションから除外するユーザー ID |
| `isAiGenerated` | `"true"` / `"false"` | いいえ | 既定 `false` |
| `isPromotional` | `"true"` / `"false"` | いいえ | 既定 `false` |
| `isR18` | `"true"` / `"false"` | いいえ | `minimumAge >= 18` の場合は未指定でも `true` |
| `hideFromMinors` | `"true"` / `"false"` | いいえ | `minimumAge >= 18` の場合は未指定でも `true` |
| `minimumAge` | number | いいえ | 最小閲覧年齢 |
| `maximumAge` | number | いいえ | 最大閲覧年齢 |
| `visibility` | `PUBLIC` / `FOLLOWERS` / `CIRCLE` | いいえ | 既定 `PUBLIC` |
| `viewerCircleId` | number/string | 条件付き | `visibility=CIRCLE` では必須 |
| `replyRestriction` | `EVERYONE` / `FOLLOWING` / `MENTIONED` / `CIRCLE` | いいえ | 既定 `EVERYONE` |
| `replyCircleId` | number/string | 条件付き | `replyRestriction=CIRCLE` では必須 |
| `scheduledFor` | ISO 8601 string | いいえ | `Date` は ISO 8601 に変換 |
| `pollOptions` | JSON 化した `string[]` | いいえ | 投票を付ける場合は 2 件以上 |
| `pollDurationHours` | number | いいえ | 投票の既定は 24 時間。正の整数 |
| `pollIsAnonymous` | `"true"` / `"false"` | いいえ | 投票の既定は `true` |
| `pollOptionImageIndices` | JSON 化した `number[]` | いいえ | `pollOptionImages` と同じ順序の選択肢 index |
| `pollOptionImages` | File/Blob[] | いいえ | 各選択肢の画像 |
| `media` | File/Blob[] | いいえ | 最大 4 件 |
| `mediaAlts` | JSON 化した `string[]` | いいえ | `media` と同じ順序。未指定は空文字 |
| `mediaSpoilerFlags` | JSON 化した `boolean[]` | いいえ | `media` と同じ順序。未指定は `false` |
| `mediaR18Flags` | JSON 化した `boolean[]` | いいえ | `media` と同じ順序。未指定は `false` |

### 投稿作成の検証

- `content` は空白だけでは本文として扱われない。
- 本投稿では、本文、メディア、投票のすべてが空だと SDK が送信前に `ValidationError` を投げる。
- メディアは 4 件を超えられない。
- 投票は 2 選択肢以上、期間は正の整数でなければならない。
- `visibility=CIRCLE` で `viewerCircleId` がない場合、または `replyRestriction=CIRCLE` で `replyCircleId` がない場合は送信されない。
- 予約日時は有効な日時でなければならない。

## Query schema

```ts
interface Pagination {
  page?: number;
  limit?: number;
  cursor?: string;
}

interface TimelineQuery {
  page?: number;
  limit?: number;
  mode?: "latest" | "trending" | "following";
}

interface RecommendedQuery extends Pagination {
  mode?: "algorithm" | "latest" | "beta" | string;
}

interface PublicFeedQuery extends Pagination {
  kind?: string;
  mode?: string;
}

interface BookmarkListQuery extends Pagination {
  folderId?: number | string;
}
```

`kind` と公開フィードの追加 `mode` 値は SPA で利用されるが、安定した列挙値は公開仕様として確認できていない。

## Response schema

```ts
interface PostResponse {
  message?: string;
  post: Post;
  scheduledPost?: ScheduledPost;
}

interface PostListResponse {
  posts: Post[];
  pagination?: PageInfo;
}

interface ReplyListResponse {
  replies: Post[];
  pagination?: PageInfo;
}

interface QuoteListResponse {
  quotes: Post[];
  pagination?: PageInfo;
}

interface UserListResponse {
  users: User[];
  pagination?: PageInfo;
}

interface ScheduledPostUpdateInput {
  content: string;
  scheduledFor: string;
}

interface BetaSurveyInput {
  preference: "beta" | "current";
  variant?: string;
}
```

`PostTranslation`、`ScheduledPost`、`PostDraft`、`BookmarkFolder`、`ConversationInfo`、`ReplyTargets`、`PostAnalytics` は [データスキーマ](./14-schemas.md) に定義する。

## 動作上の注意

- `POST /posts/{id}/translate` の request key は `targetLocale`。旧調査資料で確認された `targetLanguage` ではない。
- `GET /posts/{id}/replies` は、親投稿が削除済みでも `200` と空の `replies` を返す場合がある。
- `POST /posts/{id}/bookmark` はフォルダを指定しない場合、body 自体を省略できる。
- 投票者一覧は匿名投票では開示されない可能性がある。最終的な可否はサーバーの権限判定に従う。
- SDK は一覧レスポンスの主要配列が配列でない場合、`ResponseValidationError` として扱う。
