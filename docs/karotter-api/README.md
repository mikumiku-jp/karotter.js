# Karotter API 完全リファレンス

2026-08-01 時点の Karotter Web API、Developer API、Bot API、管理 API、Socket.IO を分野別にまとめた非公式仕様書です。Karotter が公開する安定 API だけでなく、Web SPA が使う内部 API も含みます。内部 API は予告なく変更される可能性があります。

## 情報源

| 記号 | 根拠 | 扱い |
|---|---|---|
| `公開仕様` | Karotter の Developer API ドキュメント画面 | 公開契約として記述 |
| `SPA確認` | 2026-08-01 配信の Web SPA 160 chunk、297 Method/Path | Web クライアントの実装として記述 |
| `SDK確認` | `karotter.js` 0.2.0 の型・HTTP 実装 | payload、response、既定値、検証条件を記述 |
| `動的確認` | GET、OPTIONS、OAuth redirect、公開 endpoint の実レスポンス | 観測結果として記述 |
| `未確定` | パスは確認できたが、payload または response の完全スキーマを確認できない | 推測せず `JsonObject` / `AdminJsonResponse` と明記 |

「すべて」は、上記の情報源から存在を確認できた endpoint、payload、response、認証方式、エラー、レート制限、Socket.IO event を指します。サーバー内部だけに存在し、配信クライアントや公開文書から参照されない endpoint は対象外です。

現行 SDK は SPA 確認済み 297 Method/Path をすべて直接呼び出せます。対応判定は endpoint の有無だけで終えず、body、query、端末情報の既定値、response 型、高水準 API まで照合しています。

## 分冊

| 文書 | 内容 |
|---|---|
| [01-conventions.md](./01-conventions.md) | Base URL、ヘッダ、認証、CSRF、Cookie、再試行、ページング、レート制限、エラー |
| [02-authentication.md](./02-authentication.md) | 登録、ログイン、2FA、セッション、メール、アカウント OAuth |
| [03-posts.md](./03-posts.md) | 投稿、タイムライン、投票、リアクション、予約、下書き、ブックマーク |
| [04-users-and-relationships.md](./04-users-and-relationships.md) | ユーザー、プロフィール、設定、フォロー、ブロック、ミュート |
| [05-dm-and-notifications.md](./05-dm-and-notifications.md) | DM、通話、添付、通知、Push token |
| [06-search-and-social.md](./06-search-and-social.md) | 検索、Discover、Circle、List、Story、質問、Link Preview |
| [07-communities.md](./07-communities.md) | Community、参加、管理、Home Timeline |
| [08-guilds-channels-and-bots.md](./08-guilds-channels-and-bots.md) | Guild、Channel、Role、Voice、Forum、Bot Application、Bot Token |
| [09-radio-draw-news-and-boards.md](./09-radio-draw-news-and-boards.md) | Radio、Draw、News、Boards |
| [10-developer-api.md](./10-developer-api.md) | API Key、Developer REST、Twitter v2 互換 API |
| [11-subscriptions-and-oauth.md](./11-subscriptions-and-oauth.md) | Subscription、Gift、OAuth Client、OAuth 2 / OIDC |
| [12-legal-misc-and-admin.md](./12-legal-misc-and-admin.md) | Legal、Contact、Report、Audio、管理 API |
| [13-realtime.md](./13-realtime.md) | Socket.IO 接続、Client/Server event、payload |
| [14-schemas.md](./14-schemas.md) | 共通型と response object のフィールド定義 |

## endpoint 表の読み方

各 endpoint 表は同じ列を使います。

| 列 | 意味 |
|---|---|
| `Method / Path` | `/api` からの相対パス。管理 API だけは `/control-room-x9k2` を含む |
| `認証` | `不要`、`任意`、`User`、`API Key`、`Bot`、`OAuth Bearer`、`管理者` |
| `Request` | path parameter、query、JSON、multipart field。`—` は body/query なし |
| `Response` | 成功レスポンス。型名は [14-schemas.md](./14-schemas.md) を参照 |
| `説明` | 副作用、権限条件、既定値、確認できた例外 |

## 認証の使い分け

| 認証 | ヘッダまたは Cookie | 主な用途 |
|---|---|---|
| User session | `Authorization: Bearer {accessToken}` または `karotter_at` Cookie | Web SPA、通常ユーザー API |
| API Key | `x-api-key: {apiKey}` または `Authorization: Bearer {apiKey}` | `/developer/*` |
| Bot Token | `Authorization: Bot {botToken}` | Bot 用 `/developer/guilds`、command、message |
| OAuth Bearer | `Authorization: Bearer {oauthAccessToken}` | `/oauth/userinfo` |
| 管理者 session | User session + 管理者権限 | `/control-room-x9k2/*` |

## 重要な非互換点

- 現在ユーザーは `GET /auth/me` です。`GET /users/me` は username `me` の検索になります。
- 投稿添付の field は `media`、DM 添付は `attachments`、Developer DM 画像は `images` です。
- 通常投稿は `multipart/form-data` です。JSON で送る前提ではありません。
- `POST /auth/login` は 2FA 対象アカウントで token ではなく challenge を返します。
- 401 と CSRF 403 はクライアント側の自動再試行対象です。元リクエストは最大 1 回だけ再送されます。
- 管理 API の多くはレスポンススキーマを公開していません。確認できないフィールドを`AdminJsonResponse` としています。
