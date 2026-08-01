# 共通 HTTP 仕様

## Base URL

| 用途 | URL |
|---|---|
| Primary API | `https://api.karotter.com/api` |
| Mirror JP | `https://api.karotter.jp/api` |
| Web same-origin | `https://karotter.com/api` |
| Mirror NET | `https://api.karotter.net/api` |
| Mirror karon.jp | `https://apikarotter.karon.jp/api` |
| Socket.IO | `https://api.karotter.com/socket.io` |

endpoint 表の `/posts` は `https://api.karotter.com/api/posts` を表します。Socket.IO は `/api` を付けません。

## ID、日時、真偽値

| 値 | wire format | 注意 |
|---|---|---|
| User/Post などの ID | JSON number。path では decimal string | SDK の `Snowflake` は `number`。一部 API は string 入力も受ける |
| 日時 | ISO 8601 string | 例: `2026-08-01T00:00:00.000Z` |
| multipart の boolean | `"true"` / `"false"` | JSON boolean ではなく文字列になる |
| multipart の配列 | JSON 文字列 | 例: `mediaAlts=["説明"]` |
| query の配列 | URL serializer 依存 | 公開 API では同名 key の反復を避け、文書指定に従う |

存在しない任意値は、JSON では key 自体を省略します。multipart でも未指定 field は追加しません。ただし投稿作成は Web SPA と SDK が既定値を明示送信します。

## 共通 request header

| Header | 値 | 条件 |
|---|---|---|
| `Accept` | `application/json, text/plain, */*` | SDK 既定 |
| `Content-Type` | `application/json` | JSON request |
| `Content-Type` | `multipart/form-data; boundary=...` | FormData。境界は HTTP client が設定するため手動指定しない |
| `x-client-type` | `web` / `ios` / `android` | 全通常 request |
| `x-device-id` | UUID v4 | 全通常 request |
| `x-csrf-token` | CSRF token。複数保持時は comma 区切り | state-changing request |
| `Authorization` | `Bearer {accessToken}` | User session または API Key |
| `Authorization` | `Bot {botToken}` | Bot API |
| `x-api-key` | `{apiKey}` | Developer API の別形式 |
| `Cookie` | `karotter_at=...; karotter_rt=...; karotter_csrf=...` | Browser は自動、Node は保存して再送 |
| `X-Requested-With` | `jp.karon.karotter` | Android client の既定。Android WebView 登録では明示的に除外 |

`FormData` request では既定の `Content-Type: application/json` を削除し、runtime に boundary 生成を任せます。

## 認証方式

### User session

User API は次のどちらかで認証します。

```http
Authorization: Bearer ACCESS_TOKEN
```

```http
Cookie: karotter_at=ACCESS_TOKEN; karotter_rt=REFRESH_TOKEN; karotter_csrf=CSRF_TOKEN
```

Access token が失効して 401 になった場合、refresh token または `karotter_rt` Cookie を使って `POST /auth/refresh-token` を呼びます。

### Developer API Key

```http
x-api-key: API_KEY
```

公開仕様では次も認められています。

```http
Authorization: Bearer API_KEY
```

API Key ごとに read/write scope と rate limit が設定されます。User session の access token と API Key は同じ `Bearer` scheme を使うため、呼び出す prefix を取り違えないでください。

### Bot Token

```http
Authorization: Bot BOT_TOKEN
```

Bot Token request は User token の自動 refresh 対象外です。Token がない場合、SDK は送信前に `ValidationError` を投げます。

### OAuth access token

`GET /oauth/userinfo` は OAuth token を Bearer で送ります。User session token や API Key と用途が異なります。

## CSRF

### 取得

```http
GET /api/auth/csrf-token
```

```json
{
  "csrfToken": "uuid"
}
```

レスポンスには `Set-Cookie: karotter_csrf=...; Secure; SameSite=Strict` も含まれます。SDK は JSON body と Cookie の token を両方収集し、重複を除いたうえで `x-csrf-token` に comma 区切りで入れます。

### 更新

レスポンス JSON に `csrfToken` が含まれる場合、次の request から新しい token を使います。403 response の `error` 文字列に `CSRF` が含まれる場合は、CSRF token を再取得して元 request を 1 回だけ再送します。

### 無効化

`DELETE /auth/csrf-token` は保持中の CSRF token を無効化します。SDK は成功後にメモリ上の token を削除します。

## Access token refresh

`POST /auth/refresh-token` の JSON body:

```ts
interface RefreshTokenRequest {
  deviceId: string;
  clientType: "web" | "ios" | "android";
  deviceName: string;
  refreshToken?: string;
}
```

`refreshToken` を省略する場合は `karotter_rt` Cookie が必要です。

```ts
interface RefreshTokenResponse {
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
}
```

SDK の refresh 制御:

1. 同時に複数 request が 401 になっても refresh request は 1 本に共有します。
2. 成功後、各元 request を 1 回だけ再送します。
3. refresh が失敗した場合、access/refresh token を削除します。
4. refresh 失敗後 15 秒は再 refresh を行わず `REFRESH_COOLDOWN` を返します。
5. login、register、me、CSRF、refresh、logout 自身は自動 refresh 対象外です。

## Cookie と client storage

| 名称 | 種別 | 用途 |
|---|---|---|
| `karotter_at` | HttpOnly Cookie | access token |
| `karotter_rt` | HttpOnly Cookie | refresh token |
| `karotter_csrf` | Cookie | CSRF token |
| `deviceId` | localStorage | Web の UUID v4 |
| `karotter:accounts` | localStorage | Web の複数アカウント一覧 |
| `karotter:active-account-id` | localStorage | active account |
| `karotter_native_access_token` | Capacitor Preferences | Native access token |
| `karotter_native_refresh_token` | Capacitor Preferences | Native refresh token |
| `karotter_native_device_id` | Capacitor Preferences | Native device ID |

観測された auth Cookie は `Secure; SameSite=Strict` です。Node.js client は `Set-Cookie` から name/value を保存し、以後の `Cookie` header に再構成します。

## Request body の種類

| 種類 | 使用例 | 注意 |
|---|---|---|
| JSON | login、設定更新、like、follow | `Content-Type: application/json` |
| multipart | 投稿、DM 添付、Story、News 画像、Boards 添付 | boundary を自動生成する |
| query | list、search、pagination | undefined は送らない |
| body なし | delete、join、read | `Content-Length` を前提にしない |
| text response | Legal terms/privacy | JSON parse しない |

## ページング

### Offset

```ts
interface OffsetPagination {
  page?: number;
  limit?: number;
}
```

```http
GET /api/posts/timeline?page=1&limit=20
```

### Cursor

```ts
interface CursorPagination {
  limit?: number;
  cursor?: number | string;
}
```

```http
GET /api/notifications?limit=20&cursor=631800
```

### Response

```ts
interface PageInfo {
  page?: number;
  limit?: number;
  total?: number;
  pages?: number;
  hasNext?: boolean;
  nextCursor?: number | string | null;
}
```

すべての list endpoint がすべての field を返すわけではありません。Cursor list は `nextCursor`、Offset list は `page` / `pages` を主に使います。`hasNext=false` または `nextCursor=null` を終端として扱います。

## 成功 response の共通形

更新系の最小 response:

```ts
interface MessageEnvelope {
  message: string;
}
```

作成・取得系は resource 名を key にします。

```json
{ "post": { "id": 631800 } }
```

list 系は複数形 key と任意の `pagination` を返します。

```json
{
  "posts": [],
  "pagination": {
    "hasNext": false,
    "nextCursor": null
  }
}
```

例外は `GET /developer/users/me` のように resource を直接返す endpoint と、Twitter v2 互換の `{ "data": ... }` 形式です。各分冊の `Response` 列を優先してください。

## エラー response

代表形:

```json
{
  "error": "メッセージ",
  "status": 400,
  "code": "VALIDATION_FAILED",
  "errors": {}
}
```

BAN:

```json
{
  "error": "アカウントがBANされています",
  "code": "ACCOUNT_BANNED",
  "bannedUntil": "2026-08-31T00:00:00.000Z",
  "banReason": "reason"
}
```

| Status | 意味 | SDK error |
|---|---|---|
| 400 | malformed request、検証失敗 | `BadRequestError`。`errors` があれば `ValidationError` |
| 401 | token なし・失効 | `AuthError`。User request は refresh 後 1 回再送 |
| 403 | 権限不足、CSRF、BAN、非公開 resource | `ForbiddenError`、BAN は `BannedError` |
| 404 | resource 不在 | `NotFoundError` |
| 409 | 状態競合 | `ConflictError` |
| 422 | semantic validation | `ValidationError` |
| 429 | rate limit | `RateLimitError` |
| 500–504 | server error | `ServerError` |
| response なし | DNS、接続、CORS、切断 | `NetworkError` |
| timeout | client timeout | `TimeoutError` |

`RateLimitError.retryAfterMs` は `Retry-After` または `ratelimit-reset` を秒数・HTTP date として解釈します。

## Rate limit

観測 header:

- `ratelimit-policy`
- `ratelimit-limit`
- `ratelimit-remaining`
- `ratelimit-reset`
- `retry-after`

| Endpoint | 観測値 |
|---|---|
| `POST /auth/login` | 5 / 60 秒 |
| `POST /follow/{userId}` | 5 / 60 秒 |
| `POST /contact` | 5 / 3600 秒 |
| `POST /reports` | 10 / 900 秒 |
| `PATCH /users/profile` | 15 / 60 秒 |
| 投稿の like/react/bookmark/rekarot | 30 / 60 秒 |
| `POST /posts` | 50 / 3600 秒 |
| その他の一般 endpoint | 100 / 60 秒 |

値は運用設定で変わる可能性があります。固定 sleep ではなく response header を使います。

## CORS と Android WebView

Android WebView 登録の preflight:

```http
OPTIONS /api/auth/register
Origin: https://localhost
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type,x-client-type,x-csrf-token,x-device-id
```

登録 request は `Origin: https://localhost`、`Referer: https://localhost/`、Android WebView User-Agent と client hints を使います。この経路では `X-Requested-With` を送りません。

## 既知の server 挙動

- 非数値の投稿 ID や integer 範囲外 ID に対して `GET /posts/{id}` が 500 を返す場合があります。
- 削除済み投稿の replies は空配列 200 になる場合があります。
- `/uploads/posts/{uuid}.{ext}` は未認証で配信されます。投稿削除後の物理ファイル削除は未確認です。
- 投稿添付 field と DM 添付 field を取り違えると 500 を返す場合があります。
