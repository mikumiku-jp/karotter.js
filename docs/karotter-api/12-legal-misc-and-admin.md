# Legal・Misc・Admin API

規約、問い合わせ、通報、音声 upload、管理画面専用 API を扱う。

## Legal endpoint

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/legal/terms` | 不要 | なし | `text/plain` string | 利用規約本文 |
| GET | `/legal/privacy` | 不要 | なし | `text/plain` string | プライバシーポリシー本文 |
| GET | `/legal/summary` | 不要 | なし | `LegalSummary` | 現行 version・発効日 |

```ts
interface LegalSummary {
  version: string;
  termsEffectiveDate: string;
  privacyEffectiveDate: string;
  [extra: string]: unknown;
}
```

terms/privacy は JSON ではなく text response。JSON parser を適用しない。

## Misc endpoint

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| POST | `/contact` | 不要 | `ContactInput` | `MessageEnvelope` | 問い合わせ送信 |
| POST | `/reports` | 必須 | `ReportInput` | `MessageEnvelope` | User/Post/DM などを通報 |
| POST | `/audio` | 必須 | `multipart/form-data`: `audio` | `{ url?: string, mediaUrl?: string }` | 音声 upload |

```ts
interface ContactInput {
  name: string;
  email: string;
  subject?: string;
  body: string;
}

interface ReportInput {
  targetType: "USER" | "POST" | "DM" | string;
  targetId: number | string;
  reason: string;
  description?: string;
}
```

音声 response は server version 差を吸収するため `url` と `mediaUrl` の両方を許容する。

# Admin API

## Access・prefix・型

既定 prefix は `/control-room-x9k2`。未認証では 401 を確認済み。旧 `/admin/*` は 404 であり、互換 alias ではない。すべて管理者 session と server 側の role/permission 判定を必要とする。prefix は環境差に備えて SDK constructor option で変更できる。

管理 API の多くは SPA 内部契約で、安定した詳細 schema が公開されていない。既知の型付き response 以外は次の型で表す。

```ts
type AdminJsonResponse = JsonObject | JsonArray;
type AdminMutationBody = Record<string, JsonValue | undefined>;

interface AdminListQuery {
  search?: string;
  status?: string;
  minId?: string;
  maxId?: string;
  limit?: number;
  cursor?: string;
}
```

`AdminJsonResponse` と記した endpoint は「任意 JSON」ではなく「SPA で endpoint は確認済みだが、固定 response schema は未確認」という意味。

## Dashboard・User

| Method | Path | Request | Response | 説明 |
|---|---|---|---|---|
| GET | `/control-room-x9k2` | なし | `AdminJsonResponse` | 管理 index |
| GET | `/control-room-x9k2/dashboard` | なし | `AdminJsonResponse` | Dashboard |
| GET | `/control-room-x9k2/overview` | なし | `AdminJsonResponse` | Overview |
| GET | `/control-room-x9k2/analytics` | なし | `AdminJsonResponse` | Analytics |
| GET | `/control-room-x9k2/stats` | なし | `AdminJsonResponse` | Stats |
| GET | `/control-room-x9k2/users` | Query: `AdminListQuery` | `AdminUserListResponse` | User 一覧 |
| POST | `/control-room-x9k2/users` | `AdminMutationBody` | `AdminJsonResponse` | User 作成 |
| GET | `/control-room-x9k2/users/search` | Query: `AdminListQuery` | `AdminUserListResponse` | User 検索 |
| GET | `/control-room-x9k2/users/{userId}` | なし | `{ user: AdminUser }` | User 詳細 |
| PATCH | `/control-room-x9k2/users/{userId}/ban` | `AdminBanInput` | `MessageEnvelope` | Ban |
| PATCH | `/control-room-x9k2/users/{userId}/unban` | なし | `MessageEnvelope` | Ban 解除 |
| PATCH | `/control-room-x9k2/users/{userId}/verify` | `AdminMutationBody`。省略時 `{}` | `MessageEnvelope` | Verification 更新 |
| PATCH | `/control-room-x9k2/users/{userId}/flags` | `AdminUserFlags` | `MessageEnvelope` | Bot/Parody/年齢 flag |
| PATCH | `/control-room-x9k2/users/{userId}/account` | `AdminMutationBody` | `MessageEnvelope` | Account field 更新 |
| PATCH | `/control-room-x9k2/users/{userId}/official-mark` | `{ officialMark: string|string[]|null }` | `MessageEnvelope` | Official mark 更新 |
| PATCH | `/control-room-x9k2/users/{userId}/email` | `{ email: string }` | `MessageEnvelope` | Email 更新 |
| PATCH | `/control-room-x9k2/users/{userId}/password` | `{ password: string }` | `MessageEnvelope` | Password 強制更新 |
| PATCH | `/control-room-x9k2/users/{userId}/role` | `{ role: string }` | `MessageEnvelope` | Role 更新 |
| GET | `/control-room-x9k2/users/{userId}/sessions` | なし | `AdminJsonResponse` | Session |
| GET | `/control-room-x9k2/users/{userId}/posts` | なし | `AdminPostListResponse` | Post |
| GET | `/control-room-x9k2/users/{userId}/reports` | なし | `AdminJsonResponse` | Report |
| GET | `/control-room-x9k2/users/{userId}/bans` | なし | `AdminJsonResponse` | Ban 履歴 |
| GET | `/control-room-x9k2/users/{userId}/notes` | なし | `AdminJsonResponse` | Note |
| GET | `/control-room-x9k2/users/{userId}/history` | なし | `AdminJsonResponse` | 操作履歴 |
| POST | `/control-room-x9k2/users/{userId}/warn` | `{ reason?: string, message?: string }` | `MessageEnvelope` | 警告 |
| DELETE | `/control-room-x9k2/users/{userId}` | なし | `MessageEnvelope` | User 削除 |
| GET | `/control-room-x9k2/users/{userId}/restrict` | なし | `AdminJsonResponse` | Restrict 画面/状態取得 |
| GET | `/control-room-x9k2/users/{userId}/suspend` | なし | `AdminJsonResponse` | Suspend 画面/状態取得 |

```ts
interface AdminUser extends User {
  email?: string;
  isBanned?: boolean;
  bannedUntil?: string | null;
  banReason?: string | null;
  reportCount?: number;
}

interface AdminUserListResponse {
  users: AdminUser[];
  pagination?: PageInfo;
}

interface AdminUserFlags {
  isBotAccount?: boolean;
  isParodyAccount?: boolean;
  hideProfileFromMinors?: boolean;
  adminForceBot?: boolean;
  adminForceParody?: boolean;
}

interface AdminBanInput {
  reason?: string;
  bannedUntil?: string | Date;
}
```

`Date` は SDK が ISO 8601 string に変換する。`restrict` と `suspend` は名称に反して確認済み method が GET。状態変更 API と推測して POST/PATCH しない。

## Post・Story・Report・News

| Method | Path | Request | Response | 説明 |
|---|---|---|---|---|
| GET | `/control-room-x9k2/posts` | Query: `AdminListQuery` | `AdminPostListResponse` | Post 一覧 |
| GET | `/control-room-x9k2/posts/search` | Query: `AdminListQuery` | `AdminPostListResponse` | Post 検索 |
| GET | `/control-room-x9k2/posts/{postId}` | なし | `{ post: Post }` | Post 詳細 |
| PATCH | `/control-room-x9k2/posts/{postId}/flags` | `AdminPostFlags` | `MessageEnvelope` | Flag 更新 |
| PATCH | `/control-room-x9k2/posts/{postId}/hide` | `{ hidden?: boolean }` | `MessageEnvelope` | 強制非表示 |
| DELETE | `/control-room-x9k2/posts/{postId}` | なし | `MessageEnvelope` | Post 削除 |
| GET | `/control-room-x9k2/stories` | Query: `AdminListQuery` | `AdminJsonResponse` | Story 一覧 |
| PATCH | `/control-room-x9k2/stories/{storyId}/flags` | `AdminPostFlags` | `MessageEnvelope` | Story flag 更新 |
| DELETE | `/control-room-x9k2/stories/{storyId}` | なし | `MessageEnvelope` | Story 削除 |
| GET | `/control-room-x9k2/reports` | Query: `AdminListQuery` | `AdminJsonResponse` | Report 一覧 |
| GET | `/control-room-x9k2/reports/pending` | なし | `AdminJsonResponse` | Pending |
| GET | `/control-room-x9k2/reports/resolved` | なし | `AdminJsonResponse` | Resolved |
| GET | `/control-room-x9k2/reports/{reportId}` | なし | `AdminJsonResponse` | 詳細 |
| POST | `/control-room-x9k2/reports/{reportId}/resolve` | `{ note?: string }` | `MessageEnvelope` | 解決 |
| POST | `/control-room-x9k2/reports/{reportId}/dismiss` | なし | `MessageEnvelope` | 却下 |
| POST | `/control-room-x9k2/reports/{reportId}/escalate` | なし | `MessageEnvelope` | Escalate |
| GET | `/control-room-x9k2/news` | Query: `AdminListQuery` | `AdminJsonResponse` | Article 一覧 |
| GET | `/control-room-x9k2/news/comments` | Query: `AdminListQuery` | `AdminJsonResponse` | Comment 一覧 |
| PATCH | `/control-room-x9k2/news/{articleId}/review` | `AdminNewsDecision` | `MessageEnvelope` | Review |
| DELETE | `/control-room-x9k2/news/{articleId}` | なし | `MessageEnvelope` | Article 削除 |
| DELETE | `/control-room-x9k2/news/comments/{commentId}` | なし | `MessageEnvelope` | Comment 削除 |

```ts
interface AdminPostListResponse {
  posts: Post[];
  pagination?: PageInfo;
}

interface AdminPostFlags {
  isR18?: boolean;
  hideFromMinors?: boolean;
  adminForceHidden?: boolean;
  adminForceR18?: boolean;
}

interface AdminNewsDecision {
  action: "approve" | "reject" | "unpublish";
  reviewNote?: string;
}
```

## Moderation・Assets・Settings

すべて response は `AdminJsonResponse`。POST endpoint だけ request body を記載する。

| Method | Path | Request | 説明 |
|---|---|---|---|
| GET | `/control-room-x9k2/bot-requests` | なし | Bot request |
| GET | `/control-room-x9k2/verification-requests` | なし | Verification request |
| GET | `/control-room-x9k2/appeals` | なし | Appeal |
| GET | `/control-room-x9k2/bans` | なし | Ban 一覧 |
| GET | `/control-room-x9k2/bans/{banId}` | なし | Ban 詳細 |
| POST | `/control-room-x9k2/bans/create` | `AdminMutationBody` | Ban 作成 |
| GET | `/control-room-x9k2/ip-bans` | なし | IP Ban 一覧 |
| GET | `/control-room-x9k2/ip-bans/{banId}` | なし | IP Ban 詳細 |
| GET | `/control-room-x9k2/shadowbans` | なし | Shadowban |
| GET | `/control-room-x9k2/announcements` | なし | Announcement 一覧 |
| GET | `/control-room-x9k2/announcements/{announcementId}` | なし | 詳細 |
| POST | `/control-room-x9k2/announcements/create` | `AdminMutationBody` | 作成 |
| GET | `/control-room-x9k2/badges` | なし | Badge 一覧 |
| GET | `/control-room-x9k2/badges/{badgeId}` | なし | Badge 詳細 |
| POST | `/control-room-x9k2/badges/create` | `AdminMutationBody` | Badge 作成 |
| GET | `/control-room-x9k2/emoji` | なし | Emoji 一覧 |
| GET | `/control-room-x9k2/emoji/{emojiId}` | なし | Emoji 詳細 |
| POST | `/control-room-x9k2/emoji/create` | `AdminMutationBody` | Emoji 作成 |
| GET | `/control-room-x9k2/frames` | なし | Frame 一覧 |
| GET | `/control-room-x9k2/frames/{frameId}` | なし | Frame 詳細 |
| GET | `/control-room-x9k2/themes` | なし | Theme 一覧 |
| GET | `/control-room-x9k2/themes/{themeId}` | なし | Theme 詳細 |
| GET | `/control-room-x9k2/stickers` | なし | Sticker 一覧 |
| GET | `/control-room-x9k2/stickers/{stickerId}` | なし | Sticker 詳細 |
| GET | `/control-room-x9k2/feature-flags` | なし | Feature flag |
| GET | `/control-room-x9k2/settings` | なし | Setting 一覧 |
| POST | `/control-room-x9k2/settings` | `AdminMutationBody` | Setting 更新 |
| GET | `/control-room-x9k2/config` | なし | Config |
| GET | `/control-room-x9k2/audit-log` | なし | Audit log |
| GET | `/control-room-x9k2/logs` | なし | Log 一覧 |
| GET | `/control-room-x9k2/logs/{type}` | なし | 指定 log |
| GET | `/control-room-x9k2/maintenance` | なし | Maintenance 状態 |
| POST | `/control-room-x9k2/maintenance` | `AdminMutationBody`。省略時 `{}` | Maintenance 更新 |
| GET | `/control-room-x9k2/cron` | なし | Cron |
| GET | `/control-room-x9k2/queue` | なし | Queue |
| GET | `/control-room-x9k2/cache` | なし | Cache |
| POST | `/control-room-x9k2/cache/clear` | なし | Cache clear。response は `MessageEnvelope` |
| GET | `/control-room-x9k2/api-keys` | なし | API key 管理 |
| GET | `/control-room-x9k2/apikeys` | なし | 別画面で確認された API key path |
| GET | `/control-room-x9k2/webhooks` | なし | Webhook |
| GET | `/control-room-x9k2/blocked-words` | なし | Blocked word |

`api-keys` と `apikeys` は両方が SPA/SDK で確認されている。推測で統合しない。

## Diagnostics

| Method | Path | Request | Response | 説明 |
|---|---|---|---|---|
| GET | `/control-room-x9k2/beta-experiment` | なし | `AdminJsonResponse` | Beta experiment |
| GET | `/control-room-x9k2/test-recommend` | Query: `{ limit?: number, userId?: number|string }` | `TestRecommendResponse` | Recommend score 検証 |
| GET | `/control-room-x9k2/test-trending` | Query: `{ limit?: number }` | `TestTrendingResponse` | Trending score 検証 |
| GET | `/control-room-x9k2/survey-results` | Query: `{ limit?: number }` | `SurveyResultsResponse` | Survey 集計 |

```ts
interface TestRecommendResponse {
  targetUser: { id: number; username: string; displayName: string };
  variant?: "A" | "B" | "C" | "D" | "E";
  followingCount: number;
  candidateCount: number;
  signalsSummary: {
    authorAffinityCount: number;
    socialProofCount: number;
    mutualFollowCount: number;
    tagAffinityTop10: Array<{ tag: string; score: number }>;
  };
  rawTopByScore: RecommendRawCandidate[];
  ranked: RecommendRankedCandidate[];
}

interface TestTrendingResponse {
  candidateCount: number;
  rawTop10: TrendingRawCandidate[];
  ranked: TrendingRankedCandidate[];
}

interface SurveyResultsResponse {
  totalResponses: number;
  satisfactionScore?: number;
  responses?: Array<{
    userId: number;
    rating: number;
    comment?: string;
    submittedAt: string;
  }>;
  [extra: string]: unknown;
}
```

Recommend/Trending の内訳 field は [データスキーマ](./14-schemas.md) に定義する。

## その他の管理 GET endpoint

次の endpoint はすべて管理者認証、request body なし、response `AdminJsonResponse`。`AdminListQuery` と記したものだけ query を送れる。

| Method | Path | Request | Response | 内容 |
|---|---|---|---|---|
| GET | `/control-room-x9k2/actions` | Query: `AdminListQuery` | `AdminJsonResponse` | Action |
| GET | `/control-room-x9k2/audit` | Query: `AdminListQuery` | `AdminJsonResponse` | Audit |
| GET | `/control-room-x9k2/backup` | なし | `AdminJsonResponse` | Backup 状態 |
| POST | `/control-room-x9k2/backup` | `AdminMutationBody`。省略時 `{}` | `MessageEnvelope` | Backup 開始 |
| GET | `/control-room-x9k2/database` | なし | `AdminJsonResponse` | Database |
| GET | `/control-room-x9k2/dm` | Query: `AdminListQuery` | `AdminJsonResponse` | DM |
| GET | `/control-room-x9k2/domains` | なし | `AdminJsonResponse` | Domain |
| GET | `/control-room-x9k2/draw` | Query: `AdminListQuery` | `AdminJsonResponse` | Draw |
| GET | `/control-room-x9k2/emails` | Query: `AdminListQuery` | `AdminJsonResponse` | Email |
| GET | `/control-room-x9k2/feedback` | Query: `AdminListQuery` | `AdminJsonResponse` | Feedback |
| GET | `/control-room-x9k2/features` | なし | `AdminJsonResponse` | Feature |
| GET | `/control-room-x9k2/filtered-words` | なし | `AdminJsonResponse` | Filtered word |
| GET | `/control-room-x9k2/flagged-content` | Query: `AdminListQuery` | `AdminJsonResponse` | Flagged content |
| GET | `/control-room-x9k2/gacha` | なし | `AdminJsonResponse` | Gacha |
| GET | `/control-room-x9k2/gacha/items` | なし | `AdminJsonResponse` | Gacha item |
| GET | `/control-room-x9k2/gacha/{gachaId}` | なし | `AdminJsonResponse` | Gacha 詳細 |
| GET | `/control-room-x9k2/invites` | Query: `AdminListQuery` | `AdminJsonResponse` | Invite |
| GET | `/control-room-x9k2/jobs` | Query: `AdminListQuery` | `AdminJsonResponse` | Job |
| GET | `/control-room-x9k2/media` | Query: `AdminListQuery` | `AdminJsonResponse` | Media |
| GET | `/control-room-x9k2/migrations` | なし | `AdminJsonResponse` | Migration |
| GET | `/control-room-x9k2/moderation` | なし | `AdminJsonResponse` | Moderation |
| GET | `/control-room-x9k2/moderation/automod` | なし | `AdminJsonResponse` | AutoMod |
| GET | `/control-room-x9k2/moderation/filters` | なし | `AdminJsonResponse` | Filter |
| GET | `/control-room-x9k2/moderation/queue` | Query: `AdminListQuery` | `AdminJsonResponse` | Queue |
| GET | `/control-room-x9k2/moderation/rules` | なし | `AdminJsonResponse` | Rule |
| GET | `/control-room-x9k2/moderation/words` | なし | `AdminJsonResponse` | Word |
| GET | `/control-room-x9k2/monetization` | なし | `AdminJsonResponse` | Monetization |
| GET | `/control-room-x9k2/notifications` | Query: `AdminListQuery` | `AdminJsonResponse` | Notification |
| GET | `/control-room-x9k2/payments` | Query: `AdminListQuery` | `AdminJsonResponse` | Payment |
| GET | `/control-room-x9k2/permissions` | なし | `AdminJsonResponse` | Permission |
| GET | `/control-room-x9k2/premium` | なし | `AdminJsonResponse` | Premium |
| GET | `/control-room-x9k2/radio` | Query: `AdminListQuery` | `AdminJsonResponse` | Radio |
| GET | `/control-room-x9k2/rate-limits` | なし | `AdminJsonResponse` | Rate limit |
| GET | `/control-room-x9k2/roles` | なし | `AdminJsonResponse` | Role |
| GET | `/control-room-x9k2/search` | Query: `AdminListQuery & { q?: string }` | `AdminJsonResponse` | Search |
| GET | `/control-room-x9k2/search/index` | なし | `AdminJsonResponse` | Search index |
| GET | `/control-room-x9k2/sessions` | Query: `AdminListQuery` | `AdminJsonResponse` | Session |
| GET | `/control-room-x9k2/stats/daily` | なし | `AdminJsonResponse` | Daily stats |
| GET | `/control-room-x9k2/stats/posts` | なし | `AdminJsonResponse` | Post stats |
| GET | `/control-room-x9k2/stats/users` | なし | `AdminJsonResponse` | User stats |
| GET | `/control-room-x9k2/subscriptions` | Query: `AdminListQuery` | `AdminJsonResponse` | Subscription |
| GET | `/control-room-x9k2/system` | なし | `AdminJsonResponse` | System |
| GET | `/control-room-x9k2/tasks` | Query: `AdminListQuery` | `AdminJsonResponse` | Task |
| GET | `/control-room-x9k2/trending` | なし | `AdminJsonResponse` | Trending |
| GET | `/control-room-x9k2/trending/override` | なし | `AdminJsonResponse` | Trending override |
| GET | `/control-room-x9k2/uploads` | Query: `AdminListQuery` | `AdminJsonResponse` | Upload |


## 管理 API の運用上の注意

- 管理 response は個人情報や moderation 情報を含む。ブラウザ console、監視 URL、クライアント側 analytics へ記録しない。
- `DELETE`、ban、password、role、official mark、所有権に関わる操作は不可逆または強い副作用を持つ。response 成功後に対象を再取得する。
- 汎用 `AdminMutationBody` endpoint へ未確認 field を推測して送らない。SPA request または server implementation を根拠にする。
- prefix は秘匿による防御ではない。認証・認可が必須。
