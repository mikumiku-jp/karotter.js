# Community API

コミュニティの作成、参加、メンバー管理、投稿モデレーション、ホームタイムラインを扱う。コミュニティの管理操作は所有者・モデレーターなど、サーバーが定める role を必要とする。

## Endpoint 一覧

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/communities` | 任意 | Query: `Pagination` | `CommunityListResponse` | コミュニティ一覧 |
| POST | `/communities` | 必須 | `CommunityForm` | `{ community: Community }` | 作成 |
| GET | `/communities/{communityId}` | 任意 | なし | `{ community: Community }` | 詳細 |
| PATCH | `/communities/{communityId}` | 必須 | `CommunityForm` | `{ community: Community }` | 更新 |
| DELETE | `/communities/{communityId}` | 必須 | なし | `MessageEnvelope` | 削除 |
| POST | `/communities/{communityId}/join` | 必須 | `JsonObject`。省略時 `{}` | `MessageEnvelope` | 参加または参加申請 |
| POST | `/communities/{communityId}/leave` | 必須 | なし | `MessageEnvelope` | 退出 |
| POST | `/communities/{communityId}/invite` | 必須 | `JsonObject` | `MessageEnvelope` | 招待 |
| GET | `/communities/{communityId}/members` | 任意 | Query: `Pagination` | `{ members: CommunityMember[] }` | メンバー一覧 |
| DELETE | `/communities/{communityId}/members/{userId}` | 必須 | なし | `MessageEnvelope` | メンバー削除 |
| PATCH | `/communities/{communityId}/members/{userId}/role` | 必須 | `{ role: string }` | `MessageEnvelope` | role 更新 |
| POST | `/communities/{communityId}/owner-transfer` | 必須 | `{ userId: number|string }` | `MessageEnvelope` | 所有権移譲 |
| GET | `/communities/{communityId}/posts` | 任意 | Query: `CommunityPostsQuery` | `CommunityPostsResponse` | 投稿一覧 |
| POST | `/communities/{communityId}/posts/{postId}/hide` | 必須 | なし | `MessageEnvelope` | コミュニティ内で投稿を非表示 |
| PUT | `/communities/{communityId}/rules` | 必須 | `JsonObject` | `MessageEnvelope` | ルール置換 |
| GET | `/communities/{communityId}/reports` | 必須 | Query: `Pagination` | `{ reports: CommunityReport[] }` | 通報一覧 |
| PATCH | `/communities/{communityId}/reports/{reportId}` | 必須 | `JsonObject` | `{ report: CommunityReport }` | 通報状態・対応内容を更新 |
| GET | `/communities/home-timelines` | 必須 | なし | `{ timelines: CommunityTimeline[] }` | ホーム表示コミュニティ一覧 |
| POST | `/communities/{communityId}/home-timeline` | 必須 | なし | `MessageEnvelope` | ホームへ追加 |
| DELETE | `/communities/{communityId}/home-timeline` | 必須 | なし | `MessageEnvelope` | ホームから削除 |
| PUT | `/communities/home-timelines/reorder` | 必須 | `{ communityIds: (number|string)[] }` | `MessageEnvelope` | 表示順を置換 |

## Request schema

```ts
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type JsonObject = { [key: string]: JsonValue };
type CommunityForm = JsonObject | FormData;

interface CommunityPostsQuery {
  page?: number;
  limit?: number;
  cursor?: string;
  tab?: string;
}
```

### 作成・更新

`POST /communities` と `PATCH /communities/{communityId}` は JSON と `multipart/form-data` の両方を受ける。画像を含む場合は multipart を使う。名前、説明、参加方式、画像に相当する field は SPA で確認されているが、サーバーの安定した完全 schema は公開されていない。現行 SDK は `JsonObject` または呼び出し側が構築した `FormData` を透過送信する。

### 参加・招待・ルール・通報

これらの endpoint は server feature の変更が多く、現行 SDK は payload を `JsonObject` として扱う。

- `join`: 公開コミュニティでは `{}` で直接参加し、承認制では申請になる場合がある。
- `invite`: 招待対象を表す field を含む。対象 field の固定名は未確認。
- `rules`: ルール集合を body 全体として送る。部分更新ではなく `PUT`。
- `reports/{reportId}`: status、action、note に相当する管理 field が使われるが、列挙値は未確認。

未確認 field をこの文書で推測して固定しない。SPA の変更に追従する場合はネットワーク request と server response を再確認する。

## Response schema

```ts
interface Community {
  id: number;
  name: string;
  description?: string;
  joinType?: string;
  memberCount?: number;
  effectiveMinimumAge?: number | null;
  [extra: string]: unknown;
}

interface CommunityMember {
  user?: User;
  userId?: number;
  role?: string;
  [extra: string]: unknown;
}

interface CommunityReport {
  id: number;
  status?: string;
  [extra: string]: unknown;
}

interface CommunityTimeline {
  community: Community;
  position?: number;
  [extra: string]: unknown;
}

interface CommunityListResponse {
  communities: Community[];
  pagination?: PageInfo;
  [extra: string]: unknown;
}

interface CommunityPostsResponse {
  posts: Post[];
  pagination?: PageInfo;
  [extra: string]: unknown;
}
```

`joinType`、member `role`、report `status`、投稿 tab はサーバーが文字列で拡張できる。クライアント側で未確認値を破棄しない。

## 権限と整合性

- 認証任意の取得 endpoint でも、非公開コミュニティや年齢制限では未認証・権限不足が拒否される。
- `owner-transfer` は所有権を変更する強い操作。成功 response を確認してから管理 UI の所有者表示を更新する。
- `home-timelines/reorder` は部分移動ではなく ID 配列全体を送る。現在の一覧を取得してから並べ替える。
- `hidePost` は投稿自体を削除しない。グローバルな投稿削除は [投稿 API](./03-posts.md) の `DELETE /posts/{id}`。
