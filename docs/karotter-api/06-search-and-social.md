# 検索・Social API

統合検索、Discover、サークル、リスト、ストーリー、匿名質問、リンクプレビューを扱う。

## 検索 endpoint

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/search` | 不要 | Query: `SearchQuery` | `UnifiedSearchResult` | ユーザー・投稿・ハッシュタグの統合検索 |
| GET | `/search/users` | 不要 | Query: `SearchQuery` | `{ users: User[], pagination?: PageInfo }` | ユーザー検索 |
| GET | `/search/communities` | 不要 | Query: `SearchQuery` | `CommunityListResponse` | コミュニティ検索 |
| GET | `/search/posts` | 不要 | Query: `PostSearchQuery` | `{ posts: Post[], pagination?: PageInfo }` | 投稿検索 |
| GET | `/search/hashtags` | 不要 | Query: `SearchQuery` | `{ hashtags: Hashtag[], pagination?: PageInfo }` | ハッシュタグ検索 |
| GET | `/search/trending/topics` | 不要 | Query: `{ limit?: number }` | `{ trends: TrendingTopic[] }` | トレンド topic。SDK 既定 `limit=5` |
| GET | `/search/trending/hashtags` | 不要 | Query: `{ limit?: number }` | `{ hashtags: Hashtag[] }` | トレンド hashtag。SDK 既定 `limit=5` |
| GET | `/search/discover/latest` | 不要 | Query: `CursorPagination` | `{ posts: Post[] }` | 最新投稿 Discover |
| GET | `/search/discover/media` | 不要 | Query: `CursorPagination` | `{ posts: Post[] }` | メディア Discover |
| GET | `/search/discover/topics` | 不要 | Query: `CursorPagination` | `{ posts: Post[] }` | topic Discover |

```ts
interface SearchQuery {
  q: string;
  page?: number;
  limit?: number;
  cursor?: string | number;
  compact?: boolean | "1";
}

interface PostSearchQuery extends SearchQuery {
  type?: "latest" | "media" | "topics";
}

interface UnifiedSearchResult {
  users: User[];
  posts: Post[];
  hashtags: Hashtag[];
  pagination?: PageInfo;
}
```

## サークル endpoint

サークルは投稿の `visibility=CIRCLE` と返信制限の閲覧者集合に使う。

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/social/circles` | 必須 | なし | `{ circles: Circle[] }` | 一覧 |
| POST | `/social/circles` | 必須 | `{ name: string, memberIds?: number[] }` | `{ circle: Circle }` | 作成 |
| PATCH | `/social/circles/{id}` | 必須 | `{ name?: string }` | `{ circle: Circle }` | 名前更新 |
| DELETE | `/social/circles/{id}` | 必須 | なし | `MessageEnvelope` | 削除 |
| POST | `/social/circles/{circleId}/members` | 必須 | `{ userId: number }` | `MessageEnvelope` | メンバー追加 |
| DELETE | `/social/circles/{circleId}/members/{userId}` | 必須 | なし | `MessageEnvelope` | メンバー削除 |

旧 SPA 調査では circle 更新 body に `memberIds` が現れるが、現行 SDK が保証する更新 field は `name` のみ。メンバー変更には専用 endpoint を使う。

## リスト endpoint

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/social/lists` | 必須 | なし | `{ lists: SocialList[] }` | 一覧 |
| POST | `/social/lists` | 必須 | `SocialListCreateInput` | `{ list: SocialList }` | 作成 |
| PATCH | `/social/lists/{id}` | 必須 | `SocialListUpdateInput` | `{ list: SocialList }` | 更新 |
| DELETE | `/social/lists/{id}` | 必須 | なし | `MessageEnvelope` | 削除 |
| GET | `/social/lists/{listId}/posts` | 必須 | Query: `Pagination` | `PostListResponse` | メンバーの投稿 |
| POST | `/social/lists/{listId}/members` | 必須 | `{ userId: number }` | `MessageEnvelope` | メンバー追加 |
| DELETE | `/social/lists/{listId}/members/{userId}` | 必須 | なし | `MessageEnvelope` | メンバー削除 |

```ts
interface SocialListCreateInput {
  name: string;
  description?: string;
  isPublic?: boolean;
}

interface SocialListUpdateInput {
  name?: string;
  description?: string;
  isPublic?: boolean;
}
```

旧 SPA 調査では list 更新 body に `memberIds` が現れるが、現行 SDK では専用 member endpoint と分離している。

## ストーリー endpoint

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/social/stories` | 不要 | Query: `StoryListQuery` | `StoriesResponse` | 公開・閲覧可能なストーリー。`filter` で表示対象を指定 |
| POST | `/social/stories` | 必須 | `multipart/form-data` | `{ story: Story }` | ストーリー作成 |
| DELETE | `/social/stories/{id}` | 必須 | なし | `MessageEnvelope` | 削除 |
| GET | `/social/stories/user/{userId}` | 不要 | なし | `StoriesResponse` | ユーザーのストーリー |
| GET | `/social/stories/{id}/comments` | 必須 | なし | `StoryCommentsResponse` | コメント一覧 |
| POST | `/social/stories/{id}/comments` | 必須 | `{ content: string }` | `{ comment: StoryComment }` | コメント投稿 |
| GET | `/social/stories/{id}/viewers` | 必須 | なし | `{ viewers: StoryViewer[] }` | 閲覧者一覧 |
| POST | `/social/stories/{id}/like` | 必須 | なし | `MessageEnvelope` | いいね |
| DELETE | `/social/stories/{id}/like` | 必須 | なし | `MessageEnvelope` | いいね解除 |
| POST | `/social/stories/{id}/views` | 必須 | なし | `MessageEnvelope` | 閲覧記録 |

```ts
interface StoriesResponse {
  stories: Story[];
  pagination?: PageInfo;
}

interface StoryListQuery extends Pagination {
  filter?: string;
}

interface StoryCommentsResponse {
  comments: StoryComment[];
  pagination?: PageInfo;
}
```

ストーリー作成の multipart field 一式は SPA の非公開実装に依存し、安定した request schema を確認できていない。`media`、caption、公開範囲、年齢制限に相当する field が使われるが、フィールド名を公開契約として固定しない。現行 SDK は呼び出し側が構築した `FormData` をそのまま送信する。

## 質問 endpoint

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/social/questions/inbox` | 必須 | なし | `QuestionsInboxResponse` | 受信箱 |
| POST | `/social/questions/{id}` | 必須 | `{ content: string }` | `{ question: AnonymousQuestion }` | 質問へ回答 |
| DELETE | `/social/questions/{id}` | 必須 | なし | `MessageEnvelope` | 質問削除 |
| POST | `/social/questions/send` | 必須 | `QuestionSendInput` | `MessageEnvelope` | 匿名質問送信 |
| POST | `/social/questions/ask` | 必須 | `QuestionSendInput` | `MessageEnvelope` | 質問送信 |
| POST | `/social/questions/post` | 必須 | `QuestionSendInput` | `MessageEnvelope` | 質問を投稿フローへ送る |

```ts
interface QuestionsInboxResponse {
  questions: AnonymousQuestion[];
  pagination?: PageInfo;
}

interface QuestionSendInput {
  targetUserId: number;
  content: string;
}
```

`send`、`ask`、`post` は同じ payload だが、サーバー上のワークフローが異なるため相互置換しない。

## リンクプレビュー endpoint

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/social/link-preview` | 不要 | Query: `{ url: string }` | `LinkPreview` | OGP 相当メタデータ取得 |
| GET | `/social/link-preview-image` | 不要 | Query: `{ url: string }` | `{ imageUrl: string | null }` | プレビュー画像 proxy |

外部 URL はサーバー側 SSRF フィルタの対象。localhost、プライベートネットワーク、許可されない scheme は拒否される可能性がある。redirect 後の URL もサーバー判定に従う。

## 主要 schema

```ts
interface Hashtag {
  id: number;
  name: string;
  usageCount: number;
  trendScore: number;
  createdAt?: string;
  updatedAt?: string;
}

interface TrendingTopic {
  token: string;
  label: string;
  type: string;
  postCount: number;
  authorCount: number;
  trendScore: number;
}
```

`Circle`、`SocialList`、`Story`、`StoryComment`、`StoryViewer`、`AnonymousQuestion`、`LinkPreview` の完全な field は [データスキーマ](./14-schemas.md) を参照。
