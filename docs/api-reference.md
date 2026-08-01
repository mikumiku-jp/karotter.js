# Karotter API Reference

2026-08-01 時点の Karotter Web SPA、公式 API ドキュメント画面、Android APK 0.2.2、書き込み副作用のない HTTP プローブから再構成した非公式 API リファレンスです。

解析元:

| 種別 | 内容 |
|---|---|
| Web SPA | `index-BmTVCph9.js` から再帰取得した 160 JavaScript chunk |
| Web API 定義 | `api-docs-BRKNRS3h.js` の公開 API 17分類・85 endpoint |
| 直接呼び出し | 現行 SPA から正規化した 297 Method/Path |
| Android | `KarotterApp` release `0.2.2` APK |
| 動的確認 | GET / OPTIONS / OAuth redirect / 公開 endpoint のレスポンス |


パスはすべて `https://api.karotter.com/api` からの相対です。

## 目次

| セクション | 内容 |
|---|---|
| [共通仕様](#共通仕様) | Base URL、ヘッダ、認証表記、ページング、共通レスポンス |
| [認証](#認証) | CSRF、login、register、session、OAuth |
| [投稿](#投稿) | 投稿作成、タイムライン、反応、投票、下書き |
| [ユーザー / プロフィール](#ユーザー--プロフィール) | ユーザー取得、設定、プロフィール画像 |
| [フォロー / ブロック / ミュート](#フォロー--ブロック--ミュート) | social graph操作 |
| [DM](#dm) | グループ、メッセージ、通話、リアクション |
| [通知](#通知) | 通知一覧、既読、push登録 |
| [検索 / Discover](#検索--discover) | 検索、トレンド、Discover |
| [Social](#social) | circle、list、story、質問、link preview |
| [Community](#community) | Community CRUD、参加、管理、ホーム表示 |
| [Guild / Channel / Bot](#guild--channel--bot) | Guild、Channel、Bot Application、Bot Token API |
| [Radio / Spaces](#radio--spaces) | space作成、参加、WebRTC関連 |
| [Draw](#draw) | 絵チャルーム、chat、layer同期 |
| [News](#news) | ニュース記事、コメント、review |
| [Boards](#boards) | 掲示板、thread、reply、reaction |
| [API Keys / Developer API](#api-keys--developer-api) | API key、開発者API、Twitter v2互換 |
| [Subscription / OAuth 2](#subscription--oauth-2) | Subscription、Gift、OAuth Client、認可コードフロー |
| [Legal / Misc](#legal--misc) | 規約、お問い合わせ、通報 |
| [管理API](#管理api) | `/control-room-x9k2` 配下 |
| [Socket.IO](#socketio) | realtime endpointとevent |
| [レート制限](#レート制限) | 観測済み制限 |
| [エラー](#エラー) | エラー形式、status |
| [観測済みの注意点](#観測済みの注意点) | 解析で分かった癖 |

## 読み方

endpoint表は次の形式です。

| 列 | 意味 |
|---|---|
| `Method` | HTTP method |
| `Path` | `/api` からの相対パス |
| `認証` | 未ログイン可否。詳細は [認証表記](#認証表記) |
| `Body / Query` | JSON body、multipart field、query parameter |
| `備考` | 解析で分かった用途や制約 |

`{id}`、`{userId}`、`{postId}` は数値IDです。`{usernameOrId}` はusername文字列または数値IDです。`{slug}` は掲示板やニュースのslugです。

## 共通仕様

### Base URL

| 用途 | URL |
|---|---|
| Primary API | `https://api.karotter.com/api` |
| Mirror JP | `https://api.karotter.jp/api` |
| Web same-origin | `https://karotter.com/api` |
| Mirror NET | `https://api.karotter.net/api` |
| Mirror karon.jp | `https://apikarotter.karon.jp/api` |
| Socket.IO | `https://api.karotter.com/socket.io` |

### 共通ヘッダ

| ヘッダ | 値 | 備考 |
|---|---|---|
| `Accept` | `application/json, text/plain, */*` | SPA既定 |
| `Content-Type` | `application/json` または `multipart/form-data` | FormData時は境界つき |
| `x-client-type` | `web` / `ios` / `android` | クライアント種別 |
| `x-device-id` | UUID v4 | localStorage / Capacitor Preferencesに保存 |
| `x-csrf-token` | CSRF token | 書き込み系で必要 |
| `Authorization` | `Bearer {accessToken}` | 認証時 |
| `Authorization` | `Bot {botToken}` | Bot Token API |
| `x-api-key` | `{apiKey}` | Developer API。Bearer API Key も公式文書に記載 |
| `Cookie` | `karotter_at`, `karotter_rt`, `karotter_csrf` | ブラウザでは自動 |

Android WebView登録成功通信では、`Origin: https://localhost`、`Referer: https://localhost/`、Android WebView UA、Android client hintsが出ます。`X-Requested-With: jp.karon.karotter` は成功登録通信では出ていません。

### 認証表記

| 表記 | 意味 |
|---|---|
| 不要 | 未ログインで200系を確認、または公開設計と判断 |
| 任意 | 未ログインでも取得できるが、ログイン時に追加状態が返る可能性あり |
| 要 | 未ログインで401を確認、またはSPA上で認証前提 |
| 管理者 | `/control-room-x9k2` 配下。未認証401を確認 |
| 未確定 | バンドルから存在を確認したが認証境界は未検証 |

### CSRFと自動リトライ

SPAのHTTPクライアントは、bodyに `csrfToken` があればメモリ上のCSRF tokenを更新します。

| 条件 | 挙動 |
|---|---|
| 401 | `/auth/refresh-token` 後に1回だけ元リクエストを再送 |
| 403かつ `error` に `CSRF` を含む | `/auth/csrf-token` 後に1回だけ元リクエストを再送 |
| 403かつ `code: "ACCOUNT_BANNED"` | ローカル認証状態を消してBAN画面へ遷移 |
| 自動リトライ除外 | `/auth/login`, `/auth/register`, `/auth/me`, `/auth/csrf-token`, `/auth/refresh-token`, `/auth/logout` |

### ページング

Offset方式:

```http
GET /posts/timeline?page=1&limit=20
```

Cursor方式:

```http
GET /notifications?limit=20&cursor=631800
```

レスポンス例:

```json
{
  "posts": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5,
    "hasNext": true,
    "nextCursor": 631780
  }
}
```

### 共通オブジェクトの目安

厳密な完全スキーマではなく、SPAとSDK実装で参照されている主要フィールドです。

`User`:

```json
{
  "id": 1,
  "username": "karon",
  "displayName": "karon",
  "bio": "",
  "avatarUrl": "/uploads/avatars/...",
  "headerUrl": "/uploads/headers/...",
  "followersCount": 0,
  "followingCount": 0,
  "postsCount": 0,
  "isPrivate": false,
  "isVerified": false,
  "createdAt": "2026-05-01T00:00:00.000Z"
}
```

`Post`:

```json
{
  "id": 631800,
  "content": "text",
  "authorId": 1,
  "parentId": null,
  "quotedPostId": null,
  "mediaUrls": [],
  "mediaTypes": [],
  "visibility": "PUBLIC",
  "replyRestriction": "EVERYONE",
  "likesCount": 0,
  "rekarotsCount": 0,
  "repliesCount": 0,
  "viewsCount": 0,
  "liked": false,
  "rekaroted": false,
  "bookmarked": false,
  "author": {},
  "poll": null,
  "createdAt": "2026-05-01T00:00:00.000Z"
}
```

### Cookie / Storage

| 名称 | 種別 | 備考 |
|---|---|---|
| `karotter_at` | Cookie | access token。HttpOnly、Secure、SameSite=Strict |
| `karotter_rt` | Cookie | refresh token。HttpOnly、Secure、SameSite=Strict |
| `karotter_csrf` | Cookie | CSRF token。Secure、SameSite=Strict |
| `deviceId` | localStorage | UUID v4 |
| `karotter:accounts` | localStorage | マルチアカウント |
| `karotter:active-account-id` | localStorage | active account |
| `karotter_native_access_token` | Capacitor Preferences | Android/iOS用 |
| `karotter_native_refresh_token` | Capacitor Preferences | Android/iOS用 |
| `karotter_native_device_id` | Capacitor Preferences | Android/iOS用 |

## 認証

### `GET /auth/csrf-token`

認証: 不要

レスポンス:

```json
{
  "csrfToken": "uuid"
}
```

`Set-Cookie: karotter_csrf=...; Secure; SameSite=Strict` も返ります。

### `POST /auth/login`

認証: 不要

JSON:

```json
{
  "identifier": "username-or-email",
  "password": "password",
  "deviceId": "uuid",
  "clientType": "web",
  "deviceName": "Web on macOS",
  "gender": "OTHER"
}
```

`gender` は任意です。Androidでは `clientType: "android"`、`deviceName: "App on Android"`。

レスポンス:

```json
{
  "message": "ログインに成功しました",
  "accessToken": "jwt",
  "refreshToken": "jwt-or-token",
  "sessionId": "uuid",
  "deviceId": "uuid",
  "user": {
    "id": 1,
    "username": "name"
  }
}
```

2FA が必要な場合は Token 本体ではなく challenge が返ります。

```json
{
  "twoFactorRequired": true,
  "twoFactorToken": "temporary-token"
}
```

### `POST /auth/register`

認証: 不要。既存セッションつき登録も観測。

JSON:

```json
{
  "email": "user@example.com",
  "username": "username",
  "gender": "OTHER",
  "password": "password",
  "birthday": "2000-01-01",
  "acceptTerms": true,
  "acceptPrivacy": true,
  "turnstileToken": "token-or-empty-string",
  "_ts": 1777995965503
}
```

WebではTurnstile tokenが入ります。Android APK 0.2.2では `turnstileToken` は空文字、`_ts` は登録画面表示時刻です。登録bodyには `deviceId`、`clientType`、`deviceName` は入りません。

karotter.js の `auth.register()` / `karotter.register()` では、`email` / `username` / `password` だけが必須です。`gender` は省略時に `"OTHER"`、`birthday` は `"2000-01-01"`、`acceptTerms` / `acceptPrivacy` は `true` を送ります。

Android WebViewのpreflight:

```http
OPTIONS /api/auth/register
Origin: https://localhost
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type,x-client-type,x-csrf-token,x-device-id
```

Turnstile:

| 項目 | 値 |
|---|---|
| sitekey | `0x4AAAAAACujb-w-3YVWR1zA` |
| script | `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit` |

### 認証関連endpoint一覧

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| GET | `/auth/me` | 要 | なし | 現在ユーザー |
| POST | `/auth/logout` | 要 | なし | token削除 |
| POST | `/auth/refresh-token` | 任意 | `deviceId`, `clientType`, `deviceName`, `refreshToken?` | Cookieの `karotter_rt` でも可 |
| GET | `/auth/sessions` | 要 | なし | セッション一覧 |
| DELETE | `/auth/sessions/{sessionId}` | 要 | なし | 指定セッション失効 |
| DELETE | `/auth/sessions/others` | 要 | なし | 他セッション失効 |
| DELETE | `/auth/sessions/all` | 要 | なし | 全セッション失効 |
| POST | `/auth/switch-session` | 要 | `sessionId?`, `userId?` | マルチアカウント切替 |
| POST | `/auth/session-unread-snapshots` | 要 | `deviceId` | セッション別未読数 |
| POST | `/auth/forgot-password` | 不要 | `email` | Turnstileなし |
| POST | `/auth/reset-password` | 不要 | `token`, `password` | URL query tokenをSPAが読む |
| POST | `/auth/verify-email` | 不要 | `token` | メール認証 |
| POST | `/auth/me/email` | 要 | `email` | SPA上は現パスワードなし |
| POST | `/auth/me/email/resend` | 要 | なし | 再送 |
| POST | `/auth/resend-verification` | 不要 | `email` | メール指定再送 |
| POST | `/auth/login/2fa` | 不要 | `twoFactorToken`, `code` | 2FA ログイン完了 |
| GET | `/auth/2fa/setup` | 要 | なし | Secret・QR 情報 |
| POST | `/auth/2fa/enable` | 要 | `code` | 有効化・Backup Code 発行 |
| POST | `/auth/2fa/disable` | 要 | `code?`, `backupCode?`, `password?` | 無効化 |
| GET | `/auth/legal-quiz` | 任意 | なし | 規約クイズ |
| POST | `/auth/legal-quiz/grade` | 任意 | `legalQuizToken`, `legalQuizAnswers` | 採点 |
| DELETE | `/auth/oauth/{provider}` | 要 | なし | OAuth 接続解除 |
| GET | `/auth/oauth/google/start` | 不要 | `mode`, `frontendOrigin?`, `next?`, `addAccount?` | 302 |
| GET | `/auth/oauth/discord/start` | 不要 | 同上 | 302 |
| GET | `/auth/oauth/{provider}/callback` | 不要 | OAuth callback | サーバ処理 |

## 投稿

### 投稿作成 / 編集

`POST /posts` と `PUT /posts/{id}` は `multipart/form-data`。

実サイトの通常投稿では `visibility=PUBLIC` と `replyRestriction=EVERYONE` を常に送ります。`isAiGenerated`、`isPromotional`、`isR18`、`hideFromMinors` も boolean string として常に送ります。年齢指定がない場合は `false`、`minimumAge >= 18` の場合は `isR18=true` と `hideFromMinors=true` です。media配列は空でも `mediaAlts=[]`、`mediaSpoilerFlags=[]`、`mediaR18Flags=[]` を送ります。

pollを有効化した場合、未指定値は `pollIsAnonymous=true`、`pollDurationHours=24`、`pollOptionImageIndices=[]` です。

| Field | 型 | 備考 |
|---|---|---|
| `content` | string | 本文 |
| `parentId` | number/string | 返信先 |
| `quotedPostId` | number/string | 引用元 |
| `questionId` | number/string | 質問回答 |
| `excludedMentions` | JSON number[] | 除外メンション |
| `isAiGenerated` | boolean string | AI生成 |
| `isPromotional` | boolean string | 宣伝 |
| `isR18` | boolean string | R18 |
| `hideFromMinors` | boolean string | 未成年非表示 |
| `minimumAge` | number | 最小年齢 |
| `maximumAge` | number | 最大年齢 |
| `visibility` | `PUBLIC` / `FOLLOWERS` / `CIRCLE` | 公開範囲 |
| `viewerCircleId` | number/string | CIRCLE時 |
| `replyRestriction` | `EVERYONE` / `FOLLOWING` / `MENTIONED` / `CIRCLE` | 返信制限 |
| `replyCircleId` | number/string | CIRCLE時 |
| `scheduledFor` | ISO8601 | 予約投稿 |
| `pollOptions` | JSON string[] | 投票 |
| `pollIsAnonymous` | boolean string | 匿名投票 |
| `pollDurationHours` | number | 投票期間 |
| `pollOptionImageIndices` | JSON number[] | 選択肢画像index |
| `pollOptionImages` | File[] | 選択肢画像 |
| `media` | File[] | 投稿添付 |
| `mediaAlts` | JSON string[] | alt |
| `mediaSpoilerFlags` | JSON boolean[] | spoiler |
| `mediaR18Flags` | JSON boolean[] | R18 |

### 投稿endpoint一覧

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| GET | `/posts/{id}` | 任意 | なし | 公開投稿は未ログイン可。非公開は403 |
| POST | `/posts` | 要 | multipart | 作成 |
| PUT | `/posts/{id}` | 要 | multipart | 編集 |
| DELETE | `/posts/{id}` | 要 | なし | 削除 |
| GET | `/posts/timeline` | 要 | `page`, `limit`, `mode` | mode: `latest` / `trending` / `following` |
| GET | `/posts/recommended` | 不要 | `page`, `limit`, `cursor` | 公開推奨投稿 |
| GET | `/v2/feed/public` | 不要 | `kind?`, `mode?`, `page?`, `limit?`, `cursor?` | 公開フィード |
| POST | `/v2/feed/views` | 任意 | `postIds` | 公開フィード View 記録 |
| GET | `/posts/trending` | 不要 | なし | トレンド |
| GET | `/posts/{id}/replies` | 任意 | `page`, `limit`, `cursor` | 削除済み親でも空配列200を観測 |
| GET | `/posts/{id}/quotes` | 任意 | `page`, `limit`, `cursor` | 引用一覧 |
| GET | `/posts/{id}/likes` | 任意 | `page`, `limit`, `cursor` | ユーザー一覧 |
| GET | `/posts/{id}/rekarots` | 任意 | `page`, `limit`, `cursor` | ユーザー一覧 |
| GET | `/posts/{id}/conversation` | 要 | なし | 会話情報 |
| POST | `/posts/{id}/conversation/leave` | 要 | なし | 会話離脱 |
| GET | `/posts/{id}/reply-targets` | 要 | なし | 返信対象候補 |
| GET | `/posts/{id}/analytics` | 要 | なし | 投稿分析 |
| POST | `/posts/{id}/like` | 要 | なし | いいね |
| PUT | `/posts/scheduled/{id}` | 要 | 予約投稿更新 payload | 予約投稿更新 |
| POST | `/posts/{id}/translate` | 任意 | `targetLanguage` | 投稿翻訳 |
| DELETE | `/posts/{id}/like` | 要 | なし | いいね解除 |
| POST | `/posts/{id}/rekarot` | 要 | なし | リカロート |
| DELETE | `/posts/{id}/rekarot` | 要 | なし | リカロート解除 |
| POST | `/posts/{id}/bookmark` | 要 | なし | ブックマーク |
| DELETE | `/posts/{id}/bookmark` | 要 | なし | ブックマーク解除 |
| PUT | `/posts/{id}/bookmark-folders` | 要 | `folderIds` | フォルダ割当 |
| POST | `/posts/{id}/react` | 要 | `emoji` | リアクション |
| DELETE | `/posts/{id}/react/{emoji}` | 要 | なし | リアクション削除 |
| GET | `/posts/{id}/react/{emoji}/users` | 任意 | `page`, `limit`, `cursor` | リアクションユーザー |
| POST | `/posts/{id}/poll/vote` | 要 | `optionId` | 投票 |
| GET | `/posts/{postId}/poll/options/{optionId}/voters` | 要 | `page`, `limit`, `cursor` | 投票者 |
| POST | `/posts/batch-views` | 任意 | `postIds` | view記録 |
| POST | `/posts/feedback/beta-survey` | 要 | `preference` | beta/current |
| GET | `/posts/scheduled/me` | 要 | なし | 自分の予約投稿 |
| DELETE | `/posts/scheduled/{id}` | 要 | なし | 予約取消 |
| GET | `/posts/me/bookmarks` | 要 | `page`, `limit` | 自分のブックマーク |
| GET | `/posts/me/bookmark-folders` | 要 | なし | フォルダ一覧 |
| POST | `/posts/me/bookmark-folders` | 要 | `name` | フォルダ作成 |
| PATCH | `/posts/me/bookmark-folders/{folderId}` | 要 | `name?` | フォルダ更新 |
| DELETE | `/posts/me/bookmark-folders/{folderId}` | 要 | なし | フォルダ削除 |
| GET | `/posts/drafts` | 要 | なし | 下書き一覧 |
| POST | `/posts/drafts` | 要 | multipart | 下書き作成 |
| PUT | `/posts/drafts/{draftId}` | 要 | multipart | 下書き更新 |
| DELETE | `/posts/drafts/{draftId}` | 要 | なし | 下書き削除 |

## ユーザー / プロフィール

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| GET | `/users/{usernameOrId}` | 不要 | なし | username列挙可。`email`等は返らない |
| GET | `/users/{userId}/posts` | 不要 | `page`, `limit`, `cursor` | 投稿一覧 |
| GET | `/users/{userId}/likes` | プライバシー依存 | `page`, `limit`, `cursor` | 非公開時403 |
| GET | `/users/{userId}/media` | 不要 | `page`, `limit`, `cursor` | メディア投稿 |
| GET | `/users/{userId}/replies` | 不要 | `page`, `limit`, `cursor` | 返信 |
| GET | `/users/{userId}/followers` | 不要 | `page`, `limit`, `cursor` | フォロワー |
| GET | `/users/{userId}/following` | 不要 | `page`, `limit`, `cursor` | フォロー |
| GET | `/users/{userId}/mutual-followers` | 要 | `page`, `limit`, `cursor` | 共通フォロワー |
| GET | `/users/recommended` | 不要 | `limit` | おすすめユーザー |
| GET | `/users/level-ranking` | 不要 | `page?`, `limit?` | Level ranking |
| GET | `/users/username/quota` | 要 | なし | username変更枠 |
| PATCH | `/users/profile` | 要 | profile JSON | プロフィール更新 |
| PATCH | `/users/status` | 要 | `status`, `statusMessage?` | オンライン状態 |
| PATCH | `/users/settings` | 要 | settings JSON | 設定 |
| PATCH | `/users/password` | 要 | `currentPassword`, `newPassword` | パスワード変更 |
| PATCH | `/users/username` | 要 | `username` | username変更 |
| PATCH | `/users/profile/pinned-post` | 要 | `postId?` | 固定投稿 |
| DELETE | `/users/account` | 要 | `password` | アカウント削除 |
| POST | `/profile/avatar` | 要 | multipart `avatar` | アバター |
| POST | `/profile/header` | 要 | multipart `header` | ヘッダー |

## フォロー / ブロック / ミュート

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| POST | `/follow/{userId}` | 要 | なし | フォロー |
| DELETE | `/follow/{userId}` | 要 | なし | フォロー解除 |
| DELETE | `/follow/follower/{userId}` | 要 | なし | フォロワー削除 |
| GET | `/follow/requests/pending` | 要 | なし | 承認待ち |
| POST | `/follow/requests/{requestId}/{accept|reject}` | 要 | なし | 申請応答 |
| POST | `/follow/{userId}/post-notify` | 要 | なし | 投稿通知ON |
| DELETE | `/follow/{userId}/post-notify` | 要 | なし | 投稿通知OFF |
| GET | `/follow/block` | 要 | なし | ブロック一覧 |
| POST | `/follow/block/{userId}` | 要 | なし | ブロック |
| DELETE | `/follow/block/{userId}` | 要 | なし | ブロック解除 |
| GET | `/follow/mute` | 要 | なし | ミュート一覧 |
| POST | `/follow/mute/{userId}` | 要 | なし | ミュート |
| DELETE | `/follow/mute/{userId}` | 要 | なし | ミュート解除 |
| POST | `/follow/hide-rekarots/{userId}` | 要 | なし | リカロート非表示 |
| DELETE | `/follow/hide-rekarots/{userId}` | 要 | なし | 非表示解除 |

## DM

### DMメッセージmultipart

| Field | 型 | 備考 |
|---|---|---|
| `content` | string | 本文 |
| `replyToId` | number/string | 返信先 |
| `attachments` | File[] | 添付 |
| `attachmentAlts` | JSON string[] | alt |
| `attachmentSpoilerFlags` | JSON boolean[] | spoiler |
| `attachmentR18Flags` | JSON boolean[] | R18 |
| `pollOptions` | JSON string[] | 投票 |
| `pollDurationHours` | number | 投票期間 |

### DM endpoint一覧

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| GET | `/dm/groups` | 要 | `limit`, `cursor` | グループ一覧 |
| GET | `/dm/unread/count` | 要 | なし | DM 未読数 |
| POST | `/dm/groups` | 要 | `userIds` | グループ作成 |
| POST | `/dm/start` | 要 | `targetUserId` | 1対1開始 |
| GET | `/dm/groups/{groupId}` | 要 | なし | グループ取得 |
| PATCH | `/dm/groups/{groupId}` | 要 | `name?`, `memberIds?` | グループ更新 |
| DELETE | `/dm/groups/{groupId}` | 要 | なし | グループ削除 |
| GET | `/dm/groups/{groupId}/messages` | 要 | `limit`, `cursor` | メッセージ一覧 |
| POST | `/dm/groups/{groupId}/messages` | 要 | multipart | 送信 |
| POST | `/dm/groups/{groupId}/read` | 要 | なし | 既読 |
| POST | `/dm/groups/{groupId}/leave` | 要 | なし | 退出 |
| POST | `/dm/groups/{groupId}/clear` | 要 | なし | 履歴削除 |
| POST | `/dm/groups/{groupId}/members` | 要 | `userIds` | メンバー追加 |
| DELETE | `/dm/groups/{groupId}/members/{userId}` | 要 | なし | メンバー削除 |
| POST | `/dm/groups/{groupId}/request/{accept|reject}` | 要 | なし | DMリクエスト応答 |
| GET | `/dm/groups/{groupId}/call` | 要 | なし | 通話状態 |
| POST | `/dm/groups/{groupId}/call/start` | 要 | なし | 通話開始 |
| POST | `/dm/groups/{groupId}/call/join` | 要 | なし | 通話参加 |
| POST | `/dm/groups/{groupId}/call/leave` | 要 | なし | 通話退出 |
| GET | `/dm/groups/{groupId}/info` | 要 | なし | 情報 |
| GET | `/dm/groups/{groupId}/settings` | 要 | なし | 設定 |
| PATCH | `/dm/groups/{groupId}/settings` | 要 | settings JSON | 設定更新 |
| GET | `/dm/me/settings` | 要 | なし | 自分の設定 |
| POST | `/dm/groups/{groupId}/typing` | 要 | なし | 入力中 |
| POST | `/dm/groups/{groupId}/typing/stop` | 要 | なし | 入力停止 |
| GET | `/dm/groups/{groupId}/files` | 要 | なし | 添付一覧 |
| GET | `/dm/groups/{groupId}/media` | 要 | なし | メディア一覧 |
| POST | `/dm/groups/{groupId}/pin` | 要 | `messageId` | pin |
| GET | `/dm/groups/{groupId}/pinned` | 要 | なし | pin一覧 |
| PATCH | `/dm/messages/{messageId}` | 要 | `content` | 編集 |
| DELETE | `/dm/messages/{messageId}` | 要 | なし | 削除 |
| POST | `/dm/messages/{messageId}/reactions` | 要 | `emoji` | リアクション |
| DELETE | `/dm/messages/{messageId}/reactions/{emoji}` | 要 | なし | 指定リアクション削除 |
| DELETE | `/dm/messages/{messageId}/reactions` | 要 | なし | リアクション削除 |
| POST | `/dm/messages/{messageId}/poll/vote` | 要 | `optionId` | 投票 |
| POST | `/dm/messages/{messageId}/pin` | 要 | なし | message単位pin |
| DELETE | `/dm/messages/{messageId}/pin` | 要 | なし | pin解除 |
| POST | `/dm/messages/{messageId}/report` | 要 | `reason`, `description?` | 通報 |
| POST | `/dm/messages/{messageId}/translate` | 要 | `targetLanguage` | 翻訳 |
| GET | `/dm/calls/active` | 要 | なし | active calls |
| GET | `/dm/me/calls` | 要 | なし | 自分のcalls |

## 通知

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| GET | `/notifications` | 要 | `limit`, `cursor` | 通知一覧 |
| GET | `/notifications/unread/count` | 要 | なし | 未読数 |
| GET | `/notifications/grouped-posts` | 要 | `limit`, `cursor` | 投稿単位通知 |
| PATCH | `/notifications/read-all` | 要 | なし | 全既読 |
| PATCH | `/notifications/{id}/read` | 要 | なし | 既読 |
| DELETE | `/notifications/{id}` | 要 | なし | 削除 |
| DELETE | `/notifications/all` | 要 | なし | 全削除 |
| POST | `/notifications/push/register` | 要 | `token`, `deviceId?` | push登録 |
| POST | `/notifications/push/unregister` | 要 | `token` | push解除 |

## 検索 / Discover

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| GET | `/search` | 不要 | `q`, `page?`, `limit?`, `cursor?` | 統合検索 |
| GET | `/search/users` | 不要 | 同上 | ユーザー |
| GET | `/search/communities` | 不要 | `q`, `page?`, `limit?`, `cursor?` | Community 検索 |
| GET | `/search/posts` | 不要 | `q`, `type?`, `page?`, `limit?`, `cursor?` | 投稿 |
| GET | `/search/hashtags` | 不要 | `q`, `page?`, `limit?`, `cursor?` | hashtag |
| GET | `/search/trending/topics` | 不要 | `limit` | topic |
| GET | `/search/trending/hashtags` | 不要 | `limit` | hashtag |
| GET | `/search/discover/latest` | 不要 | `limit`, `cursor` | 最新 |
| GET | `/search/discover/media` | 不要 | `limit`, `cursor` | メディア |
| GET | `/search/discover/topics` | 不要 | `limit`, `cursor` | topic |

## Social

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| GET | `/social/circles` | 要 | なし | circle一覧 |
| POST | `/social/circles` | 要 | `name`, `memberIds?` | circle作成 |
| PATCH | `/social/circles/{id}` | 要 | `name?`, `memberIds?` | circle更新 |
| DELETE | `/social/circles/{id}` | 要 | なし | circle削除 |
| POST | `/social/circles/{circleId}/members` | 要 | `userId` | member追加 |
| DELETE | `/social/circles/{circleId}/members/{userId}` | 要 | なし | member削除 |
| GET | `/social/lists` | 要 | なし | list一覧 |
| PATCH | `/social/lists/{id}` | 要 | `name?`, `description?`, `isPublic?`, `memberIds?` | list更新 |
| POST | `/social/lists` | 要 | `name`, `description?`, `isPublic?` | list作成 |
| DELETE | `/social/lists/{id}` | 要 | なし | list削除 |
| GET | `/social/lists/{listId}/posts` | 要 | `page`, `limit`, `cursor` | list投稿 |
| POST | `/social/lists/{listId}/members` | 要 | `userId` | member追加 |
| DELETE | `/social/lists/{listId}/members/{userId}` | 要 | なし | member削除 |
| GET | `/social/stories` | 不要 | `page`, `limit`, `cursor` | 公開ストーリー |
| POST | `/social/stories` | 要 | multipart | story作成 |
| DELETE | `/social/stories/{id}` | 要 | なし | story削除 |
| GET | `/social/stories/user/{userId}` | 不要 | なし | ユーザーstory |
| GET | `/social/stories/{id}/comments` | 要 | なし | コメント一覧 |
| POST | `/social/stories/{id}/comments` | 要 | `content` | コメント |
| GET | `/social/stories/{id}/viewers` | 要 | なし | viewer |
| POST | `/social/stories/{id}/like` | 要 | なし | like |
| DELETE | `/social/stories/{id}/like` | 要 | なし | unlike |
| POST | `/social/stories/{id}/views` | 要 | なし | view記録 |
| GET | `/social/questions/inbox` | 要 | なし | 質問箱 |
| POST | `/social/questions/{id}` | 要 | `content` | 回答 |
| DELETE | `/social/questions/{id}` | 要 | なし | 削除 |
| POST | `/social/questions/send` | 要 | `targetUserId`, `content` | 匿名質問送信 |
| POST | `/social/questions/ask` | 要 | `targetUserId`, `content` | 質問 |
| POST | `/social/questions/post` | 要 | `targetUserId`, `content` | 質問投稿 |
| GET | `/social/link-preview` | 不要 | `url` | OGP取得。SSRFフィルタあり |
| GET | `/social/link-preview-image` | 不要 | `url` | 画像proxy。SSRFフィルタあり |

## Community

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| GET | `/communities` | 任意 | `page?`, `limit?`, `cursor?` | 一覧 |
| POST | `/communities` | 要 | JSON または multipart | 作成 |
| GET | `/communities/{communityId}` | 任意 | なし | 詳細 |
| PATCH | `/communities/{communityId}` | 要 | JSON または multipart | 更新 |
| DELETE | `/communities/{communityId}` | 要 | なし | 削除 |
| POST | `/communities/{communityId}/join` | 要 | 参加 payload | 参加または申請 |
| POST | `/communities/{communityId}/leave` | 要 | なし | 退出 |
| POST | `/communities/{communityId}/invite` | 要 | 招待 payload | 招待 |
| GET | `/communities/{communityId}/members` | 任意 | `page?`, `limit?`, `cursor?` | メンバー |
| DELETE | `/communities/{communityId}/members/{userId}` | 要 | なし | メンバー削除 |
| PATCH | `/communities/{communityId}/members/{userId}/role` | 要 | `role` | Role 更新 |
| POST | `/communities/{communityId}/owner-transfer` | 要 | `userId` | 所有権移譲 |
| GET | `/communities/{communityId}/posts` | 任意 | `tab?`, `page?`, `limit?`, `cursor?` | 投稿 |
| POST | `/communities/{communityId}/posts/{postId}/hide` | 要 | なし | 投稿非表示 |
| PUT | `/communities/{communityId}/rules` | 要 | `rules` | ルール更新 |
| GET | `/communities/{communityId}/reports` | 要 | `page?`, `limit?`, `cursor?` | レポート |
| PATCH | `/communities/{communityId}/reports/{reportId}` | 要 | 対応 payload | レポート更新 |
| GET | `/communities/home-timelines` | 要 | なし | ホーム表示一覧 |
| POST | `/communities/{communityId}/home-timeline` | 要 | なし | ホームへ追加 |
| DELETE | `/communities/{communityId}/home-timeline` | 要 | なし | ホームから削除 |
| PUT | `/communities/home-timelines/reorder` | 要 | `communityIds` | 並び替え |

## Guild / Channel / Bot

### Guild

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| GET | `/guilds` | 要 | `page?`, `limit?`, `cursor?` | 一覧 |
| POST | `/guilds` | 要 | JSON または multipart | 作成 |
| PATCH | `/guilds/{guildId}` | 要 | JSON または multipart | 更新 |
| DELETE | `/guilds/{guildId}` | 要 | なし | 削除 |
| GET | `/guilds/{guildId}/audit-logs` | 要 | paging・filter | 監査ログ |
| GET | `/guilds/{guildId}/bans` | 要 | なし | Ban 一覧 |
| POST | `/guilds/{guildId}/bans/{userId}` | 要 | `reason?` | Ban |
| DELETE | `/guilds/{guildId}/bans/{userId}` | 要 | なし | Ban 解除 |
| GET | `/guilds/{guildId}/channels` | 要 | なし | Channel 一覧 |
| POST | `/guilds/{guildId}/channels` | 要 | Channel payload | 作成 |
| PUT | `/guilds/{guildId}/channels/reorder` | 要 | 並び順 payload | 並び替え |
| GET | `/guilds/{guildId}/events` | 要 | paging | Event 一覧 |
| POST | `/guilds/{guildId}/events` | 要 | Event payload | 作成 |
| PATCH | `/guilds/{guildId}/events/{eventId}` | 要 | Event payload | 更新 |
| DELETE | `/guilds/{guildId}/events/{eventId}` | 要 | なし | 削除 |
| GET | `/guilds/{guildId}/invites` | 要 | なし | Invite 一覧 |
| POST | `/guilds/{guildId}/invites` | 要 | Invite payload | 作成 |
| DELETE | `/guilds/{guildId}/invites/{code}` | 要 | なし | 削除 |
| POST | `/invites/{code}` | 要 | なし | Invite 受諾 |
| GET | `/guilds/{guildId}/members` | 要 | paging | Member 一覧 |
| PATCH | `/guilds/{guildId}/members/{userId}` | 要 | Member payload | 更新 |
| DELETE | `/guilds/{guildId}/members/{userId}` | 要 | なし | 削除 |
| PUT | `/guilds/{guildId}/members/{userId}/roles/{roleId}` | 要 | なし | Role 追加 |
| DELETE | `/guilds/{guildId}/members/{userId}/roles/{roleId}` | 要 | なし | Role 削除 |
| POST | `/guilds/{guildId}/members/{userId}/transfer-ownership` | 要 | なし | 所有権移譲 |
| GET | `/guilds/{guildId}/messages/search` | 要 | 検索 query | Message 検索 |
| GET | `/guilds/{guildId}/roles` | 要 | なし | Role 一覧 |
| POST | `/guilds/{guildId}/roles` | 要 | Role payload | 作成 |
| PATCH | `/guilds/{guildId}/roles/{roleId}` | 要 | Role payload | 更新 |
| DELETE | `/guilds/{guildId}/roles/{roleId}` | 要 | なし | 削除 |
| GET | `/guilds/{guildId}/voice-states` | 要 | なし | Voice State |

### Channel

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| PATCH | `/channels/{channelId}` | 要 | Channel payload | 更新 |
| DELETE | `/channels/{channelId}` | 要 | なし | 削除 |
| PUT | `/channels/{channelId}/permissions/{targetId}/{permission}` | 要 | Permission payload | 権限更新 |
| POST | `/channels/{channelId}/voice/join` | 要 | なし | Voice 参加 |
| POST | `/channels/{channelId}/voice/leave` | 要 | なし | Voice 退出 |
| POST | `/channels/{channelId}/stage` | 要 | Stage payload | Stage 作成 |
| PATCH | `/channels/{channelId}/stage` | 要 | Stage payload | Stage 更新 |
| DELETE | `/channels/{channelId}/stage` | 要 | なし | Stage 削除 |
| PATCH | `/channels/{channelId}/stage/me` | 要 | State payload | 自分の Stage State |
| PATCH | `/channels/{channelId}/stage/participants/{userId}` | 要 | State payload | 参加者更新 |
| GET | `/channels/{channelId}/forum-posts` | 要 | paging | Forum 一覧 |
| POST | `/channels/{channelId}/forum-posts` | 要 | JSON または multipart | Forum 作成 |
| GET | `/channels/{channelId}/forum-posts/{postId}` | 要 | なし | Forum 詳細 |
| POST | `/channels/{channelId}/forum-posts/{postId}/replies` | 要 | JSON または multipart | Forum 返信 |
| GET | `/channels/{channelId}/messages` | 要 | paging | Message 一覧 |
| POST | `/channels/{channelId}/messages` | 要 | JSON または multipart | Message 送信 |
| PATCH | `/channels/messages/{messageId}` | 要 | Message payload | Message 更新 |
| DELETE | `/channels/messages/{messageId}` | 要 | なし | Message 削除 |
| POST | `/channels/messages/{messageId}/reactions` | 要 | `reaction` | Reaction |

### Bot Application と Bot Token

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| GET | `/guild-bots/applications` | 要 | なし | Application 一覧 |
| POST | `/guild-bots/applications` | 要 | Application payload | 作成・Token 発行 |
| DELETE | `/guild-bots/applications/{id}` | 要 | なし | 削除 |
| POST | `/guild-bots/applications/{id}/token` | 要 | なし | Token 再生成 |
| GET | `/developer/guilds` | Bot Token | なし | 導入済み Guild |
| GET | `/developer/guilds/{guildId}/channels` | Bot Token | なし | 閲覧可能 Channel |
| POST | `/developer/channels/{channelId}/messages` | Bot Token | `content` | Bot Message |
| POST | `/developer/applications/commands` | Bot Token | Command payload | Slash Command upsert |
| PUT | `/developer/applications/commands/{commandId}/permissions` | Bot Token | `guildId`, `permissions` | Command 権限置換 |

## Radio / Spaces

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| GET | `/radio/active` | 不要 | なし | active spaces |
| GET | `/radio/me` | 要 | なし | 自分のspaces |
| GET | `/radio/upcoming` | 不要 | なし | 予定 |
| GET | `/radio/ice-servers` | 要 | なし | WebRTC ICE |
| POST | `/radio` | 要 | `title`, `description?` | 作成 |
| GET | `/radio/{id}` | 任意 | なし | 取得 |
| GET | `/radio/{id}/messages` | 任意 | `page`, `limit`, `cursor` | message |
| POST | `/radio/{id}/messages` | 要 | `content` | message送信 |
| POST | `/radio/{id}/join` | 要 | なし | 参加 |
| POST | `/radio/{id}/leave` | 要 | なし | 退出 |
| POST | `/radio/{id}/end` | 要 | なし | 終了 |
| POST | `/radio/{id}/request-speaker` | 要 | なし | speaker申請 |
| POST | `/radio/{id}/accept-speaker-invite` | 要 | なし | 招待承認 |
| POST | `/radio/{id}/participants/{participantId}/invite-speaker` | 要 | なし | speaker招待 |
| DELETE | `/radio/{id}/participants/{participantId}/invite-speaker` | 要 | なし | 招待取消 |
| PATCH | `/radio/{id}/participants/{participantId}/mute` | 要 | `muted` | mute |
| PATCH | `/radio/{id}/participants/{participantId}/role` | 要 | `role` | role変更 |
| POST | `/radio/{id}/participants/{participantId}/transfer-host` | 要 | なし | Host 移譲 |
| PATCH | `/radio/{id}/settings` | 要 | settings JSON | 設定 |
| GET | `/radio/{id}/realtime-token` | 要 | なし | Realtime Token |

## Draw

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| GET | `/draw/rooms` | 不要 | なし | 公開room |
| GET | `/draw/rooms/me` | 要 | なし | 自分のroom |
| POST | `/draw/rooms` | 要 | `title`, `description?`, `isPrivate?` | 作成 |
| GET | `/draw/rooms/{roomId}` | 任意 | なし | 取得 |
| DELETE | `/draw/rooms/{roomId}` | 要 | なし | 削除 |
| POST | `/draw/rooms/{roomId}/join` | 任意 | `inviteCode?` | 参加 |
| POST | `/draw/rooms/{roomId}/chat` | 要 | `content` | chat |
| POST | `/draw/rooms/{roomId}/invite/rotate` | 要 | なし | invite更新 |
| PUT | `/draw/rooms/{roomId}/layers` | 要 | layers JSON | layer同期 |
| GET | `/draw/rooms/{roomId}/realtime-token` | 要 | なし | Realtime Token |

## News

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| GET | `/news` | 不要 | `page`, `limit`, `cursor` | article一覧 |
| GET | `/news/me` | 要 | なし | 自分の記事 |
| GET | `/news/{slugOrId}` | 不要 | なし | article取得 |
| POST | `/news` | 要 | JSON or multipart | 作成 |
| PUT | `/news/{slugOrId}` | 要 | JSON or multipart | 更新 |
| DELETE | `/news/{slugOrId}` | 要 | なし | 削除 |
| POST | `/news/{slugOrId}/submit` | 要 | なし | review提出 |
| POST | `/news/{id}/like` | 要 | なし | like |
| DELETE | `/news/{id}/like` | 要 | なし | unlike |
| GET | `/news/{id}/comments` | 不要 | なし | comment一覧 |
| POST | `/news/{id}/comments` | 要 | `content` | comment追加 |
| PATCH | `/news/{id}/comments/{commentId}` | 要 | `content` | comment編集 |
| DELETE | `/news/{id}/comments/{commentId}` | 要 | なし | comment削除 |
| POST | `/news/uploads` | 要 | multipart | 画像upload |
| GET | `/news/admin/list` | 管理者 | `page`, `limit`, `cursor` | review一覧 |
| PATCH | `/news/admin/{id}/review` | 管理者 | `status`, `reason?` | review |

## Boards

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| GET | `/boards` | 不要 | なし | board一覧 |
| POST | `/boards` | 要 | `name`, `slug?`, `description?` | 作成 |
| DELETE | `/boards/{slug}` | 要 | なし | 削除 |
| GET | `/boards/following` | 要 | なし | following |
| GET | `/boards/{slug}` | 不要 | なし | board取得 |
| POST | `/boards/{slug}/follow` | 要 | なし | follow |
| DELETE | `/boards/{slug}/follow` | 要 | なし | unfollow |
| POST | `/boards/{slug}/threads` | 要 | multipart | thread作成 |
| GET | `/boards/{slug}/threads/{threadId}` | 不要 | なし | thread取得 |
| DELETE | `/boards/{slug}/threads/{threadId}` | 要 | なし | thread削除 |
| POST | `/boards/{slug}/threads/{threadId}/follow` | 要 | なし | thread follow |
| DELETE | `/boards/{slug}/threads/{threadId}/follow` | 要 | なし | thread unfollow |
| POST | `/boards/{slug}/threads/{threadId}/replies` | 要 | multipart | reply |
| POST | `/boards/{slug}/threads/{threadId}/reactions` | 要 | `emoji` | thread reaction |
| GET | `/boards/{slug}/threads/{threadId}/reactions/{emoji}/users` | 任意 | `page`, `limit`, `cursor` | reaction users |
| POST | `/boards/{slug}/replies/{replyId}/reactions` | 要 | `emoji` | reply reaction |
| GET | `/boards/{slug}/replies/{replyId}/reactions/{emoji}/users` | 任意 | `page`, `limit`, `cursor` | reaction users |

## API Keys / Developer API

### API Keys

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| GET | `/apikeys` | 要 | なし | API key一覧 |
| POST | `/apikeys` | 要 | key権限JSON | 作成 |
| DELETE | `/apikeys/{id}` | 要 | なし | revoke |
| POST | `/apikeys/{id}/regenerate` | 要 | なし | regenerate |

### Developer REST

公開 Developer API は `/developer` prefix を使い、`x-api-key` または `Authorization: Bearer {apiKey}` で認証します。権限は API Key の scope で制限されます。

| Method | Path | 主な権限 | Body / Query |
|---|---|---|---|
| GET | `/developer/users/me` | 認証 | なし |
| GET | `/developer/timeline` | `canReadTimeline` | `page?`, `limit?` |
| POST | `/developer/posts` | `canCreatePosts` | multipart: `content`, `parentId?`, `quotedPostId?`, `visibility?`, `media?`, `pollOptions?`, `pollDurationHours?`, 年齢・R18 flag |
| GET | `/developer/posts` | `canReadPosts` | `page?`, `limit?`, `userId?` |
| GET | `/developer/posts/{postId}` | `canReadPosts` | なし |
| GET | `/developer/posts/{postId}/replies` | `canReadPosts` | `page?`, `limit?` |
| GET | `/developer/posts/{postId}/quotes` | `canReadPosts` | paging |
| PATCH | `/developer/posts/{postId}` | `canCreatePosts` | 投稿更新 payload |
| DELETE | `/developer/posts/{postId}` | `canCreatePosts` | なし |
| POST | `/developer/posts/{postId}/like` | write | なし |
| DELETE | `/developer/posts/{postId}/like` | write | なし |
| POST | `/developer/posts/{postId}/bookmark` | write | なし |
| DELETE | `/developer/posts/{postId}/bookmark` | write | なし |
| PUT | `/developer/posts/{postId}/bookmark-folders` | write | `folderIds` |
| POST | `/developer/posts/{postId}/rekarot` | write | なし |
| DELETE | `/developer/posts/{postId}/rekarot` | write | なし |
| POST | `/developer/posts/{postId}/react` | `canCreatePosts` | `emoji` |
| DELETE | `/developer/posts/{postId}/react/{emoji}` | `canCreatePosts` | なし |
| GET | `/developer/posts/{postId}/reactions` | `canReadPosts` | なし |
| GET | `/developer/bookmarks` | read | `page?`, `limit?`, `folderId?` |
| GET | `/developer/users/{id}` | read | なし |
| GET | `/developer/users/by/username/{username}` | read | なし |
| GET | `/developer/users/{id}/followers` | `canReadFollows` | `limit?`, `cursor?` |
| GET | `/developer/users/{id}/following` | `canReadFollows` | `limit?`, `cursor?` |
| POST | `/developer/users/{id}/follow` | write | なし |
| DELETE | `/developer/users/{id}/follow` | write | なし |
| GET | `/developer/follows/{username}` | `canReadFollows` | なし |
| GET | `/developer/follow-requests` | follow | なし |
| POST | `/developer/follow-requests/{requestId}/accept` | follow | なし |
| POST | `/developer/follow-requests/{requestId}/reject` | follow | なし |
| GET | `/developer/search` | `canReadPosts` | `q`, `type?`, `page?`, `limit?` |
| GET | `/developer/news` | `canReadNews` | `page?`, `limit?` |
| POST | `/developer/news` | `canCreateNews` | `title`, `body`, `category`, `summary?` |
| POST | `/developer/news/uploads` | `canCreateNews` | multipart `media` |
| GET | `/developer/news/{articleId}` | `canReadNews` | なし |
| PUT | `/developer/news/{articleId}` | `canCreateNews` | 記事 payload |
| POST | `/developer/news/{articleId}/submit` | `canPublishNews` | なし |
| GET | `/developer/stories` | `canReadStories` | なし |
| GET | `/developer/stories/user/{username}` | `canReadStories` | なし |
| POST | `/developer/stories/{storyId}/like` | `canWriteStories` | なし |
| DELETE | `/developer/stories/{storyId}/like` | `canWriteStories` | なし |
| GET | `/developer/stories/{storyId}/comments` | `canReadStories` | なし |
| POST | `/developer/stories/{storyId}/comments` | `canWriteStories` | `content` |
| GET | `/developer/boards` | board | なし |
| GET | `/developer/boards/{slug}` | board | `limit?` |
| GET | `/developer/boards/threads/{threadId}` | board | なし |
| POST | `/developer/boards/{slug}/threads` | board | `title`, `content` |
| POST | `/developer/boards/threads/{threadId}/replies` | board | `content` |
| POST | `/developer/boards/threads/{threadId}/react` | board | `emoji` |
| POST | `/developer/boards/replies/{replyId}/react` | board | `emoji` |
| GET | `/developer/dm/groups` | `canReadDm` | `page?`, `limit?` |
| GET | `/developer/dm/groups/{groupId}/messages` | `canReadDm` | `limit?`, `cursor?` |
| POST | `/developer/dm/groups/{groupId}/messages` | `canWriteDm` | `content` |
| POST | `/developer/dm/groups/{groupId}/messages/images` | `canWriteDm` | multipart `images`, `content?`, attachment metadata |
| POST | `/developer/dm/groups/{groupId}/read` | `canReadDm` | なし |
| GET | `/developer/notifications` | notification | `page?`, `limit?`, `type?` |
| GET | `/developer/notifications/unread/count` | notification | なし |
| PATCH | `/developer/notifications/{notificationId}/read` | notification | なし |
| PATCH | `/developer/notifications/read-all` | notification | `type?` |
| DELETE | `/developer/notifications/{notificationId}` | notification | なし |
| GET | `/developer/schemas/post` | API key | なし |
| GET | `/developer/schemas/user` | API key | なし |
| GET | `/developer/schemas/poll` | API key | なし |
| GET | `/developer/schemas/timeline-item` | API key | なし |
| GET | `/developer/apikeys` | API key | なし |
| GET | `/developer/usage` | API key | なし |

### Twitter v2互換

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| GET | `/developer/2/users/me` | API key | なし | me |
| GET | `/developer/2/users/{id}` | API key | なし | user lookup |
| GET | `/developer/2/users/by/username/{username}` | API key | なし | user lookup |
| GET | `/developer/2/users/{id}/tweets` | API key | `max_results`, `pagination_token` | tweets |
| GET | `/developer/2/users/{id}/timelines/reverse_chronological` | API key | `max_results`, `pagination_token` | home timeline |
| POST | `/developer/2/tweets` | API key | `text` | create tweet |
| GET | `/developer/2/tweets/{id}` | API key | なし | tweet |
| DELETE | `/developer/2/tweets/{id}` | API key | なし | delete |
| GET | `/developer/2/tweets/search/recent` | API key | `query`, `max_results`, `next_token` | search |
| GET | `/developer/2/users/{id}/followers` | API key | なし | followers |
| GET | `/developer/2/users/{id}/following` | API key | なし | following |
| POST | `/developer/2/users/{sourceUserId}/following` | API key | `target_user_id` | follow |
| DELETE | `/developer/2/users/{sourceUserId}/following/{targetUserId}` | API key | なし | unfollow |
| GET | `/developer/2/tweets/{tweetId}/liking_users` | API key | なし | liking users |
| GET | `/developer/2/tweets/{tweetId}/retweeted_by` | API key | なし | retweeted by |
| GET | `/developer/2/tweets/{tweetId}/quote_tweets` | API key | なし | quote tweets |
| GET | `/developer/2/users/{userId}/liked_tweets` | API key | なし | liked tweets |
| GET | `/developer/2/users/{userId}/bookmarks` | API key | なし | bookmarks |
| POST | `/developer/2/users/{userId}/likes` | API key | `tweet_id` | like |
| DELETE | `/developer/2/users/{userId}/likes/{tweetId}` | API key | なし | unlike |
| POST | `/developer/2/users/{userId}/retweets` | API key | `tweet_id` | retweet |
| DELETE | `/developer/2/users/{userId}/retweets/{tweetId}` | API key | なし | unretweet |
| POST | `/developer/2/users/{userId}/blocking` | API key | `target_user_id` | block |
| GET | `/developer/2/users/{userId}/blocking` | API key | なし | blocking |
| POST | `/developer/2/users/{userId}/muting` | API key | `target_user_id` | mute |
| GET | `/developer/2/users/{userId}/muting` | API key | なし | muting |
| GET | `/developer/2/lists` | API key | なし | lists |
| GET | `/developer/2/spaces` | API key | なし | spaces |
| GET | `/developer/2/spaces/search` | API key | `query` | space search |

## Subscription / OAuth 2

### Subscription

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| GET | `/subscriptions/plans` | 任意 | なし | Plan 一覧 |
| GET | `/subscriptions/me` | 要 | なし | 現在の購読 |
| POST | `/subscriptions/checkout` | 要 | Checkout payload | Checkout URL |
| POST | `/subscriptions/portal` | 要 | Portal payload | Portal URL |
| PATCH | `/subscriptions/preferences` | 要 | Preference payload | 設定 |
| GET | `/subscriptions/gifts/received` | 要 | なし | 受領 Gift |
| GET | `/subscriptions/gifts/{giftId}` | 要 | なし | Gift 詳細 |
| POST | `/subscriptions/gifts/checkout` | 要 | Gift Checkout payload | Gift 購入 |
| POST | `/subscriptions/gifts/{giftId}/response` | 要 | `action` | 受諾・拒否 |

### OAuth Client 管理

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| GET | `/oauth/clients` | 要 | なし | Client 一覧 |
| POST | `/oauth/clients` | 要 | Client payload | Client 作成 |
| DELETE | `/oauth/clients/{clientId}` | 要 | なし | Client 削除 |
| POST | `/oauth/clients/{clientId}/secret` | 要 | なし | Secret 再生成 |

### OAuth 2 認可コードフロー

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| GET | `/oauth/authorize` | User session | `response_type=code`, `client_id`, `redirect_uri`, `scope?`, `state?`, PKCE query | 認可画面 |
| POST | `/oauth/token` | Client または PKCE | `grant_type`, `code?`, `redirect_uri?`, `client_id?`, `client_secret?`, `code_verifier?`, `refresh_token?` | Token 発行・更新 |
| GET | `/oauth/userinfo` | OAuth Bearer | なし | OIDC UserInfo |

`scope` は `profile`, `email`, `offline_access`。PKCE method は `S256` または `plain` です。

## Legal / Misc

| Method | Path | 認証 | Body / Query | 備考 |
|---|---|---|---|---|
| GET | `/legal/terms` | 不要 | なし | text |
| GET | `/legal/privacy` | 不要 | なし | text |
| GET | `/legal/summary` | 不要 | なし | version summary |
| POST | `/contact` | 不要 | `name`, `email`, `subject?`, `body` | contact |
| POST | `/reports` | 要 | `targetType`, `targetId`, `reason`, `description?` | report |
| POST | `/audio` | 要 | multipart `audio` | 音声 upload |

## 管理API

管理APIのprefixはWeb SPAバンドルから `/control-room-x9k2` と判明。未認証では401を確認。旧 `/admin/*` は404を確認。

Base: `/control-room-x9k2`

| Method | Path | 認証 | 備考 |
|---|---|---|---|
| GET | `/control-room-x9k2/dashboard` | 管理者 | dashboard |
| GET | `/control-room-x9k2/overview` | 管理者 | overview |
| GET | `/control-room-x9k2/analytics` | 管理者 | analytics |
| GET | `/control-room-x9k2/stats` | 管理者 | stats |
| GET | `/control-room-x9k2/users` | 管理者 | user list |
| GET | `/control-room-x9k2/users/search` | 管理者 | user search |
| GET | `/control-room-x9k2/users/{userId}` | 管理者 | user detail |
| PATCH | `/control-room-x9k2/users/{userId}/ban` | 管理者 | ban |
| PATCH | `/control-room-x9k2/users/{userId}/unban` | 管理者 | unban |
| PATCH | `/control-room-x9k2/users/{userId}/verify` | 管理者 | verify |
| PATCH | `/control-room-x9k2/users/{userId}/flags` | 管理者 | user flags |
| PATCH | `/control-room-x9k2/users/{userId}/account` | 管理者 | email/password/emailVerified等 |
| PATCH | `/control-room-x9k2/users/{userId}/email` | 管理者 | email |
| PATCH | `/control-room-x9k2/users/{userId}/password` | 管理者 | password |
| PATCH | `/control-room-x9k2/users/{userId}/role` | 管理者 | role |
| GET | `/control-room-x9k2/users/{userId}/sessions` | 管理者 | sessions |
| GET | `/control-room-x9k2/users/{userId}/posts` | 管理者 | posts |
| GET | `/control-room-x9k2/users/{userId}/reports` | 管理者 | reports |
| GET | `/control-room-x9k2/users/{userId}/bans` | 管理者 | bans |
| GET | `/control-room-x9k2/users/{userId}/notes` | 管理者 | notes |
| GET | `/control-room-x9k2/users/{userId}/history` | 管理者 | history |
| POST | `/control-room-x9k2/users/{userId}/warn` | 管理者 | warn |
| DELETE | `/control-room-x9k2/users/{userId}` | 管理者 | delete user |
| GET | `/control-room-x9k2/posts` | 管理者 | post list |
| GET | `/control-room-x9k2/posts/search` | 管理者 | post search |
| GET | `/control-room-x9k2/posts/{postId}` | 管理者 | post detail |
| PATCH | `/control-room-x9k2/posts/{postId}/flags` | 管理者 | flags |
| PATCH | `/control-room-x9k2/posts/{postId}/hide` | 管理者 | hide |
| DELETE | `/control-room-x9k2/posts/{postId}` | 管理者 | delete post |
| GET | `/control-room-x9k2/stories` | 管理者 | stories |
| PATCH | `/control-room-x9k2/stories/{storyId}/flags` | 管理者 | flags |
| DELETE | `/control-room-x9k2/stories/{storyId}` | 管理者 | delete |
| GET | `/control-room-x9k2/reports` | 管理者 | reports |
| GET | `/control-room-x9k2/reports/pending` | 管理者 | pending |
| GET | `/control-room-x9k2/reports/resolved` | 管理者 | resolved |
| GET | `/control-room-x9k2/reports/{reportId}` | 管理者 | detail |
| POST | `/control-room-x9k2/reports/{reportId}/resolve` | 管理者 | resolve |
| POST | `/control-room-x9k2/reports/{reportId}/dismiss` | 管理者 | dismiss |
| POST | `/control-room-x9k2/reports/{reportId}/escalate` | 管理者 | escalate |
| GET | `/control-room-x9k2/news` | 管理者 | news |
| GET | `/control-room-x9k2/news/comments` | 管理者 | comments |
| PATCH | `/control-room-x9k2/news/{articleId}/review` | 管理者 | review |
| DELETE | `/control-room-x9k2/news/{articleId}` | 管理者 | delete |
| DELETE | `/control-room-x9k2/news/comments/{commentId}` | 管理者 | delete comment |
| GET | `/control-room-x9k2/beta-experiment` | 管理者 | beta experiment |
| GET | `/control-room-x9k2/test-recommend` | 管理者 | recommend debug |
| GET | `/control-room-x9k2/test-trending` | 管理者 | trending debug |
| GET | `/control-room-x9k2/survey-results` | 管理者 | survey |

その他、管理画面から以下のGET系カテゴリが参照されます。

```text
/actions
/audit
/audit-log
/backup
/badges
/bans
/bot-requests
/cache
/config
/cron
/database
/dm
/domains
/draw
/emails
/emoji
/feature-flags
/features
/filtered-words
/flagged-content
/frames
/gacha
/gacha/items
/invites
/ip-bans
/jobs
/logs
/maintenance
/media
/migrations
/moderation
/moderation/automod
/moderation/filters
/moderation/queue
/moderation/rules
/moderation/words
/monetization
/notifications
/payments
/permissions
/premium
/queue
/radio
/rate-limits
/roles
/search
/search/index
/sessions
/settings
/shadowbans
/stats/daily
/stats/posts
/stats/users
/stickers
/subscriptions
/system
/tasks
/themes
/trending
/trending/override
/uploads
/verification-requests
/webhooks
```

## Payload 詳細

### 登録

`POST /auth/register` はJSONです。Web版ではTurnstile token必須、Android WebView相当では空文字tokenで通る経路を観測しています。

```ts
interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  birthday: string | null;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  turnstileToken?: string;
  _ts: number;
}
```

SDKの `auth.register()` / `Karotter.register()` は `gender` 未指定なら `OTHER`、`birthday` 未指定なら `2000-01-01`、`acceptTerms` と `acceptPrivacy` 未指定なら `true` を送ります。

### ログイン

`POST /auth/login` はJSONです。

```ts
interface LoginPayload {
  identifier: string;
  password: string;
  deviceId: string;
  clientType: "web" | "ios" | "android";
  deviceName?: string;
}
```

成功時は `accessToken`、`refreshToken`、`sessionId`、`deviceId`、`user` が返ります。Cookieにも `karotter_at`、`karotter_rt`、`karotter_csrf` が入ります。

### 投稿作成・編集

投稿と編集はmultipartです。SDKは実サイトに合わせて未指定の既定値も送ります。

```ts
interface CreatePostPayload {
  content?: string;
  parentId?: string | number;
  quotedPostId?: string | number;
  questionId?: string | number;
  excludedMentions?: number[];
  isAiGenerated: boolean;
  isPromotional: boolean;
  isR18: boolean;
  hideFromMinors: boolean;
  minimumAge?: number;
  maximumAge?: number;
  visibility: "PUBLIC" | "FOLLOWERS" | "CIRCLE";
  viewerCircleId?: string | number;
  replyRestriction: "EVERYONE" | "FOLLOWING" | "MENTIONED" | "CIRCLE";
  replyCircleId?: string | number;
  scheduledFor?: string;
  pollOptions?: string[];
  pollIsAnonymous?: boolean;
  pollDurationHours?: number;
  pollOptionImageIndices?: number[];
  pollOptionImages?: File[];
  media?: File[];
  mediaAlts: string[];
  mediaSpoilerFlags: boolean[];
  mediaR18Flags: boolean[];
}
```

既定値:

| Field | SDK / Web既定値 |
|---|---|
| `visibility` | `PUBLIC` |
| `replyRestriction` | `EVERYONE` |
| `isAiGenerated` | `false` |
| `isPromotional` | `false` |
| `isR18` | `false`。`minimumAge >= 18` のとき未指定なら `true` |
| `hideFromMinors` | `false`。`minimumAge >= 18` のとき未指定なら `true` |
| `mediaAlts` | `[]` |
| `mediaSpoilerFlags` | `[]` |
| `mediaR18Flags` | `[]` |
| `pollIsAnonymous` | poll有効時 `true` |
| `pollDurationHours` | poll有効時 `24` |
| `pollOptionImageIndices` | poll有効時 `[]` |

制約:

| 条件 | 必須 |
|---|---|
| `visibility=CIRCLE` | `viewerCircleId` |
| `replyRestriction=CIRCLE` | `replyCircleId` |
| 通常投稿 | `content`、`media`、`poll` のどれか |
| poll | `options` は2件以上 |
| media | 最大4件 |

返信は `parentId`、引用は `quotedPostId` を使います。返信と引用は同時指定も型上は可能ですが、実サイトUIでは別操作です。

### DM送信

DM送信はmultipartです。投稿と違い、ファイルのフィールド名は `attachments` です。

```ts
interface DmMessagePayload {
  content?: string;
  replyToId?: string | number;
  attachments?: File[];
  attachmentAlts?: string[];
  attachmentSpoilerFlags?: boolean[];
  attachmentR18Flags?: boolean[];
  pollOptions?: string[];
  pollDurationHours?: number;
}
```

本文、添付、pollのどれかが必要です。添付配列は `attachmentAlts`、`attachmentSpoilerFlags`、`attachmentR18Flags` と同じ順序で対応します。

### Story

`POST /social/stories` はmultipartです。SDKは `FormData` をそのまま渡す形です。

| Field | 型 | 備考 |
|---|---|---|
| `media` | File | 画像または動画 |
| `caption` | string | 本文 |
| `textOverlay` | string | 画面上テキスト |
| `textOverlayStyle` | JSON | 位置や色 |
| `visibility` | `PUBLIC` / `FOLLOWERS` / `CIRCLE` | 公開範囲 |
| `viewerCircleId` | number/string | CIRCLE時 |
| `minimumAge` / `maximumAge` | number | 年齢制限 |
| `isR18` / `hideFromMinors` | boolean string | 年齢制限 |

### News

`POST /news` と `PUT /news/{slugOrId}` はJSONまたはmultipartを受けます。画像を含める場合は `FormData`、テキストだけならJSONで足ります。

```ts
interface NewsArticleInput {
  title: string;
  body: string;
  category?: string;
  summary?: string;
  thumbnailUrl?: string;
  publishedAt?: string;
}
```

`POST /news/{slugOrId}/submit` でレビュー提出、`/news/admin/{id}/review` で管理者レビューです。

### Boards

board threadとreply作成はmultipartです。

| Field | 型 | 備考 |
|---|---|---|
| `title` | string | thread作成時 |
| `content` | string | thread/reply本文 |
| `images` | File[] | 添付画像 |

リアクションはJSON `{ "emoji": "👍" }` です。

### Report / Contact

```ts
interface ContactPayload {
  name: string;
  email: string;
  subject?: string;
  body: string;
}

interface ReportPayload {
  targetType: "USER" | "POST" | "DM" | string;
  targetId: number | string;
  reason: string;
  description?: string;
}
```

`POST /reports` は10回/900秒の制限を観測しています。

## Socket.IO

接続先:

```ts
io("https://api.karotter.com", {
  auth: { token: accessToken },
  withCredentials: true,
  transports: ["websocket"]
});
```

### Client to Server

```text
dm:join
dm:leave
dm:read
typing:start
typing:stop
guild:join
guild:leave
channel:join
channel:leave
guild:typing:start
voice:offer
voice:answer
voice:ice-candidate
voice:hangup
voice:participant-state
radio:signal
radio:renegotiate-request
radio:participant-state
radio:message
radio:reaction
draw:join
draw:leave
draw:layer-sync
draw:stroke
draw:cursor
draw:chat
screen-share:view
```

### Server to Client

```text
notification
dm:new-message
dm:message-deleted
dm:message-updated
dm:member-added
dm:member-left
dm:member-removed
dm:request-updated
guild:message-create
guild:message-update
guild:message-delete
guild:forum-post-create
guild:forum-post-update
guild:forum-post-delete
guild:typing:user
guild:member-joined
guild:member-removed
guild:invites-updated
guild:event-created
guild:event-updated
guild:event-deleted
guild:voice-state-updated
channel:created
channel:updated
channel:deleted
user:status
call:incoming
call:state
voice:offer
voice:answer
voice:ice-candidate
voice:hangup
voice:participant-state
radio:user-joined
radio:user-left
radio:ended
radio:signal
radio:participant-state
radio:host-disconnected
radio:host-reconnected
radio:message
radio:reaction
draw:room-state
draw:layer-sync
draw:stroke
draw:cursor
draw:chat
draw:user-left
draw:error
typing:user
typing:stop
```

## レート制限

観測ヘッダ: `ratelimit-policy`, `ratelimit-limit`, `ratelimit-remaining`, `ratelimit-reset`。

| Endpoint | 制限 |
|---|---|
| `POST /auth/login` | 5 / 60s |
| `POST /follow/{userId}` | 5 / 60s |
| `POST /contact` | 5 / 3600s |
| `POST /reports` | 10 / 900s |
| `PATCH /users/profile` | 15 / 60s |
| `POST /posts/{id}/{like|react|bookmark|rekarot}` | 30 / 60s |
| `POST /posts` | 50 / 3600s |
| その他全般 | 100 / 60s |

## エラー

代表的な形式:

```json
{ "error": "メッセージ", "status": 400 }
```

```json
{
  "error": "アカウントがBANされています",
  "code": "ACCOUNT_BANNED",
  "bannedUntil": "2026-05-07T00:00:00.000Z",
  "banReason": "reason"
}
```

| Status | 意味 |
|---|---|
| 200 | 成功 |
| 201 | 作成成功 |
| 400 | バリデーションエラー |
| 401 | 未認証 |
| 403 | 権限なし、CSRF、BAN |
| 404 | 不在 |
| 409 | 競合 |
| 422 | バリデーションエラー |
| 429 | レート制限 |
| 500 | サーバ内部エラー |

## 観測済みの注意点

- `/users/me` は現在ユーザーではなく username `me` 検索になります。現在ユーザーは `/auth/me`。
- 投稿添付フィールドは `media`、DM添付フィールドは `attachments`。取り違えると500を観測。
- 非数値投稿IDやint範囲外IDで `GET /posts/{id}` が500を返すケースを観測。
- 削除済み投稿本文は未認証API経路では復元不可。`/posts/{id}/replies` 等は空配列200のケースあり。
- `/uploads/posts/{uuid}.{ext}` は未認証で直接配信されます。投稿削除時に物理ファイルが消えるかは未確定。
- `POST /auth/refresh-token` はbodyの `refreshToken` または `karotter_rt` Cookieが必要。
