# Karotter 内部 API 仕様

karotter.com の SPA バンドル解析 + 実 API プローブ（HTTP プローブ）で再構築した非公式仕様書
低レベルな実装詳細を扱います。HTTP endpointごとに整理したリファレンスは [`api-reference.md`](./api-reference.md)。

---

## 1. ベース URL

| 用途 | URL |
|---|---|
| プライマリ | `https://api.karotter.com/api` |
| ミラー（.jp） | `https://api.karotter.jp/api` |
| ミラー（.net） | `https://api.karotter.net/api`（DNS 解決不可の場合あり） |
| ミラー（karon.jp） | `https://apikarotter.karon.jp/api` |
| Socket.IO | `https://api.karotter.com`（パス `/socket.io`、WebSocket 専用） |

CORS 許可オリジン: `karotter.com` `karotter.jp` `karotter.net` `karotter.karon.jp` `apikarotter.karon.jp` `http://localhost:5173`。

---

## 2. HTTP クライアント仕様

```ts
{
  baseURL: "https://api.karotter.com/api",
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json"
  }
}
```

### 必須ヘッダ

| ヘッダ | 値 | 用途 |
|---|---|---|
| `x-client-type` | `web` / `ios` / `android` | 実クライアント種別 |
| `x-device-id` | UUID v4 | セッション識別 |
| `x-csrf-token` | `karotter_csrf` Cookie 値 + メモリ上のトークン（カンマ連結） | 書き込み系（POST/PUT/PATCH/DELETE） |
| `Authorization` | `Bearer {accessToken}` | 認証時 |

ブラウザの `User-Agent` は実行環境が自動付与します。Node.js で明示したい場合は `userAgent`、言語を指定したい場合は `acceptLanguage` を `Client` に渡します。

### レスポンスインターセプト挙動（公式 SPA の実装より）

| 条件 | 動作 |
|---|---|
| body に `csrfToken` を含む | クライアントの CSRF メモリを更新 |
| 401 | `/auth/refresh-token` を呼んでから 1 回だけリトライ |
| 403 + `error` に `CSRF` を含む | `/auth/csrf-token` 取得後 1 回だけリトライ |
| 403 + `code: ACCOUNT_BANNED` | ローカル状態を全消去して `/login?banned=1` へ遷移 |
| 自動リトライ除外 | `/auth/login` `/auth/register` `/auth/me` `/auth/csrf-token` `/auth/refresh*` `/auth/logout` |

リフレッシュは直近失敗から 15 秒のクールダウン。

---

## 3. 認証

### ログイン

```
POST /auth/login
{
  "identifier": "username | email",
  "password": "...",
  "deviceId": "<uuid>",
  "clientType": "web",
  "deviceName": "Web on macOS",
  "gender": "OTHER"  // 任意
}
```

レスポンス:
```json
{
  "message": "ログインに成功しました",
  "accessToken": "eyJ... (JWT HS256, 30 分)",
  "refreshToken": "...",
  "sessionId": "<uuid>",
  "deviceId": "<uuid>",
  "user": { "id": ..., "username": ..., ... }
}
```

`Set-Cookie`: `karotter_at` (HttpOnly, Secure, SameSite=Strict, 1h) / `karotter_rt` (HttpOnly, 30d) / `karotter_csrf` (Secure, 30d)

### 登録

```
POST /auth/register
{
  "username": "...",
  "email": "...",
  "password": "...",
  "gender": "OTHER",
  "birthday": "YYYY-MM-DD",
  "acceptTerms": true,
  "acceptPrivacy": true,
  "turnstileToken": "<Turnstile 検証成功トークン>",
  "_ts": <number>   // 画面表示時の Date.now()
}
```

karotter.js では `email` / `username` / `password` だけ必須。`gender` は省略時 `"OTHER"`、`birthday` は `"2000-01-01"`、`acceptTerms` / `acceptPrivacy` は `true`。

- Cloudflare Turnstile の sitekey: **`0x4AAAAAACujb-w-3YVWR1zA`**
- スクリプト: `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit`
- `auth.register()` は事前に `GET /auth/csrf-token` を呼び、`karotter_csrf` Cookie と `x-csrf-token` を付けてから `POST /auth/register` を送る。
- APK 0.2.2 では `deviceId` / `clientType` / `deviceName` は登録 body に入らない。`x-client-type` / `x-device-id` ヘッダで送る。
- APK 0.2.2 ではネイティブ登録時の `turnstileToken` は空文字。

### Cookie / Storage

| Cookie | 説明 |
|---|---|
| `karotter_at` | アクセストークン（HttpOnly） |
| `karotter_rt` | リフレッシュトークン（HttpOnly） |
| `karotter_csrf` | CSRF トークン |

| localStorage | 説明 |
|---|---|
| `deviceId` | UUID v4 |
| `karotter:accounts` | マルチアカウント一覧 |
| `karotter:active-account-id` | アクティブアカウント |
| `karotter_native_access_token` | Capacitor 用 |
| `karotter_native_refresh_token` | Capacitor 用 |
| `karotter_native_device_id` | Capacitor 用 |

### OAuth（リダイレクト型）

| プロバイダ | 開始 URL | OAuth Client ID |
|---|---|---|
| Google | `GET /auth/oauth/google/start?mode=login&frontendOrigin=...&next=...&addAccount=1` | `672327254767-bs7nidnp6fb87bun8k1ii8irdqitdbf9.apps.googleusercontent.com` |
| Discord | `GET /auth/oauth/discord/start?mode=...` | `1490883272199115043` |

開始 URL を 302 で各 OAuth プロバイダへ。コールバック処理はサーバ側 `/auth/oauth/{provider}/callback`。

---

## 4. メディア

### URL 構造

```
画像投稿:    /uploads/posts/{uuid}.{ext}
DM 添付:     /uploads/dm/{uuid}.{ext}
アバター:    /uploads/avatars/avatar_{userId}_{ts}.webp
ヘッダー:    /uploads/headers/header_{userId}_{ts}.webp
```

フル URL: `https://karotter.com{path}`。CSP の `img-src` で `karotter.com` 系全ドメインを許可。

### 投稿の multipart フィールド（POST `/posts` / PUT `/posts/{id}`）

```
content                  string
parentId                 string | number
quotedPostId             string | number
questionId               string | number
excludedMentions         JSON array<number>
isAiGenerated            "true" | "false"
isPromotional            "true" | "false"
isR18                    "true" | "false"
hideFromMinors           "true" | "false"
minimumAge               number
maximumAge               number
visibility               "PUBLIC" | "FOLLOWERS" | "CIRCLE"
viewerCircleId           string | number
replyRestriction         "EVERYONE" | "FOLLOWING" | "MENTIONED" | "CIRCLE"
replyCircleId            string | number
scheduledFor             ISO8601 string
pollOptions              JSON array<string>
pollIsAnonymous          "true" | "false"
pollDurationHours        number
pollOptionImageIndices   JSON array<number>
pollOptionImages         File[]
media                    File[]                          ← 投稿は media、DM は attachments
mediaAlts                JSON array<string>
mediaSpoilerFlags        JSON array<boolean>
mediaR18Flags            JSON array<boolean>
```

### DM の multipart フィールド（POST `/dm/groups/{groupId}/messages`）

```
content                       string
replyToId                     string | number
attachments                   File[]                       ← フィールド名
attachmentAlts                JSON array<string>
attachmentSpoilerFlags        JSON array<boolean>
attachmentR18Flags            JSON array<boolean>
attachmentTypes               (レスポンスのみ)              MIME type
pollOptions                   JSON array<string>
pollDurationHours             number
```

### プロフィール画像（multipart/form-data）

```
POST /profile/avatar     フィールド: avatar=<file>
POST /profile/header     フィールド: header=<file>
```

レスポンス: `{ "imageUrl": "/uploads/avatars/..." }`

---

## 5. ページネーション

### Offset 方式（従来）

```
?page=1&limit=15
```

`limit` は多くで最大 100（サーバキャップ）。

### Cursor 方式（推奨）

```
?limit=12&cursor=<lastId>
```

初回は `cursor` なし → 最新 N 件取得。レスポンスの最後の項目 ID を `cursor` に渡して過去を遡る。

---

## 6. レート制限

レスポンスヘッダ: `ratelimit-policy` `ratelimit-limit` `ratelimit-remaining` `ratelimit-reset`。

| エンドポイント | 制限 |
|---|---|
| `POST /auth/login` | 5 / 60s |
| `POST /follow/{userId}` | 5 / 60s |
| `POST /contact` | 5 / 3600s |
| `POST /reports` | 10 / 900s |
| `PATCH /users/profile` | 15 / 60s |
| `POST /posts/{id}/{like|react|bookmark|rekarot}` | 30 / 60s |
| `POST /posts` | 50 / 3600s |
| その他全般 | 100 / 60s |

---

## 7. HTTP ステータス

| コード | 意味 |
|---|---|
| 200 | 成功 |
| 201 | 作成成功 |
| 400 | バリデーションエラー |
| 401 | 未認証 / トークン無効 |
| 403 | 権限なし |
| 404 | 不在 |
| 409 | 競合（重複操作） |
| 422 | バリデーションエラー（一部エンドポイント） |
| 429 | レート制限超過 |
| 500 | サーバ内部エラー |

エラーレスポンス形式:
```json
{ "error": "メッセージ", "status": 400 }
{ "error": "認証エラー" }
{ "error": "ACCOUNT_BANNED 用", "code": "ACCOUNT_BANNED", "bannedUntil": "...", "banReason": "..." }
```

---

## 8. 罠と挙動

- `/users/me` `/posts/me/replies` 等の `me` は username 検索になる（特別扱いではない）。**現在ユーザーは `/auth/me`** から取得。
- `/users/settings` `/users/notifications` 等の名前付きパスもユーザー名検索に解釈されうる。`/users/profile` `/users/status` 等は **PATCH メソッドで明示的に区別**される。
- 投稿の画像フィールドは `media`、DM 添付は `attachments`。間違えると **500**。
- 画像と動画の同時投稿不可（**400**）。
- POST `/auth/refresh-token` は本体 JSON か `karotter_rt` Cookie でリフレッシュトークンが必要。両方ない状態で叩くと **400 「リフレッシュトークンが必要です」**。

---

## 9. Socket.IO

### 接続

```ts
io("https://api.karotter.com", {
  auth: { token: accessToken },
  withCredentials: true,
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 8000,
  timeout: 20000,
})
```

### 受信イベント (S → C)

```
notification
dm:new-message  dm:message-deleted  dm:message-updated
dm:member-added  dm:member-left  dm:member-removed  dm:request-updated
user:status
call:incoming  call:state
voice:offer  voice:answer  voice:ice-candidate  voice:hangup  voice:participant-state
radio:user-joined  radio:user-left  radio:ended  radio:signal
radio:participant-state  radio:host-disconnected  radio:host-reconnected
radio:message  radio:reaction
draw:room-state  draw:layer-sync  draw:stroke  draw:cursor  draw:chat
draw:user-left  draw:error
typing:user  typing:stop
```

### 送信イベント (C → S)

```
dm:join  dm:leave  dm:read
typing:start  typing:stop
voice:offer  voice:answer  voice:ice-candidate  voice:hangup  voice:participant-state
radio:signal  radio:renegotiate-request  radio:participant-state
radio:message  radio:reaction
draw:join  draw:leave  draw:layer-sync  draw:stroke  draw:cursor  draw:chat
screen-share:view
```

### 主要リアルタイム payload

実装側の型は `src/realtime/events.ts` を基準にしています。フロントバンドル上で参照されている追加フィールドも型に含めています。

| イベント | 主要フィールド |
|---|---|
| `typing:user` / `typing:stop` | `groupId`, `userId?`, `username?`, `displayName?`, `user?` |
| `radio:reaction` | `spaceId`, `emoji`, `userId?`, `user?` |
| `draw:room-state` | `roomId`, `room?`, `users?`, `layers?` |
| `draw:layer-sync` | `roomId`, `layers`, `fullSync?`, `revision?`, `clientId?`, `broadcast?` |
| `draw:stroke` | `roomId`, `layerId?`, `userId?`, `username?`, `clientId?`, `points?`, `color?`, `secondaryColor?`, `size?`, `opacity?`, `drawing?` |
| `draw:cursor` | `roomId`, `userId?`, `username?`, `clientId?`, `x`, `y`, `drawing?` |

---

## 10. 検証手順（再現可能）

1. `https://karotter.com/` の HTML から `/assets/index-*.js` 等のチャンクファイル名を抽出
2. すべての `.js` チャンクを `curl` で取得
3. `js-beautify` で整形
4. `analysis/extract_final.mjs` で axios 呼び出しと `endpoint:` プロパティを抽出（191 件以上）
5. `analysis/probe.mjs` で実際に HTTP プローブし 404 / 401 を仕分け（実在判定）


---

## 11. 技術スタック（バンドルからの推測）

| 項目 | 詳細 |
|---|---|
| フロント | Vite + React + TanStack Query |
| Realtime | Socket.IO v4（クライアント側）|
| バックエンド | Node.js + Express（推測。エラー HTML が Express 形式）|
| DB | PostgreSQL（推測） |
| CDN/WAF | Cloudflare（Turnstile / cloudflareinsights）|
| 認証 | JWT (HS256) + CSRF + Refresh Token |
| OAuth | Google / Discord |
