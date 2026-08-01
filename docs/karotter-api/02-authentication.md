# 認証 API

## 全 endpoint

| Method / Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|
| `GET /auth/csrf-token` | 不要 | — | `CsrfToken` | CSRF token を JSON と Cookie で返す |
| `DELETE /auth/csrf-token` | 任意 | — | `MessageEnvelope` または空 body | CSRF token を無効化 |
| `POST /auth/register` | 不要 | `RegisterRequest` JSON | `LoginResult` | 登録し、そのまま session を作る |
| `POST /auth/login` | 不要 | `LoginRequest` JSON | `LoginResult` または `TwoFactorChallenge` | identifier は username または email |
| `POST /auth/login/2fa` | 不要 | `TwoFactorLoginRequest` JSON | `LoginResult` | 2FA challenge を完了 |
| `GET /auth/me` | User | — | `CurrentUser` | 現在の認証ユーザー |
| `POST /auth/logout` | User | `{ deviceId }` | `MessageEnvelope` | 現在の session を終了 |
| `POST /auth/refresh-token` | 任意 | `RefreshTokenRequest` JSON または refresh Cookie | `RefreshTokenResponse` | access token 更新 |
| `GET /auth/sessions` | User | — | `{ sessions: SessionInfo[] }` | User の session 一覧 |
| `DELETE /auth/sessions/{sessionId}` | User | path: `sessionId` | `MessageEnvelope` | 指定 session を失効 |
| `DELETE /auth/sessions/others` | User | — | `MessageEnvelope & { revokedCount? }` | 現在以外を失効 |
| `DELETE /auth/sessions/all` | User | — | `MessageEnvelope` | 全 session を失効 |
| `POST /auth/switch-session` | User | `{ sessionId?, userId?, deviceId?, clientType?, deviceName? }` | `SwitchSessionResult` | 保存済みアカウントへ切替 |
| `POST /auth/session-unread-snapshots` | User | `{ sessionIds?, deviceId? }` | `{ snapshots: SessionUnreadSnapshot[] }` | 指定 session ごとの未読 snapshot |
| `POST /auth/forgot-password` | 不要 | `{ email }` | `MessageEnvelope` | Reset mail を要求 |
| `POST /auth/reset-password` | 不要 | `{ token, password }` | `MessageEnvelope` | Reset token で password 更新 |
| `POST /auth/verify-email` | 不要 | `{ token }` | `MessageEnvelope` | Email verification |
| `POST /auth/me/email` | User | `{ email }` | `{ message, email, cooldownSeconds? }` | Email 変更開始 |
| `POST /auth/me/email/resend` | User | — | `MessageEnvelope` | 現在の変更先へ再送 |
| `POST /auth/resend-verification` | 不要 | `{ email }` | `MessageEnvelope` | Email 指定で verification 再送 |
| `GET /auth/2fa/setup` | User | — | `TwoFactorSetup` | TOTP secret、QR、otpauth URL |
| `POST /auth/2fa/enable` | User | `{ code }` | `TwoFactorEnableResult` | TOTP 有効化と backup code 発行 |
| `POST /auth/2fa/disable` | User | `TwoFactorDisableRequest` | `MessageEnvelope` | TOTP 無効化 |
| `GET /auth/legal-quiz` | 任意 | — | `LegalQuiz` | 規約 quiz と一時 token |
| `POST /auth/legal-quiz/grade` | 任意 | `LegalQuizGradeRequest` | `LegalQuizGradeResult` | quiz 採点 |
| `DELETE /auth/oauth/{provider}` | User | path: `google` / `discord` | `MessageEnvelope` | 接続済み provider を解除 |
| `GET /auth/oauth/google/start` | 不要 | `OAuthAccountStartQuery` | `302 Location` | Google login/register 開始 |
| `GET /auth/oauth/discord/start` | 不要 | `OAuthAccountStartQuery` | `302 Location` | Discord login/register 開始 |
| `GET /auth/oauth/{provider}/callback` | 不要 | provider callback query | redirect / error | Provider callback。server が処理 |

## CSRF

```ts
interface CsrfToken {
  csrfToken: string;
}
```

`GET /auth/csrf-token` は `Set-Cookie: karotter_csrf=...` も返します。詳細は [01-conventions.md](./01-conventions.md#csrf) を参照してください。

## 登録

### Request

```ts
interface RegisterRequest {
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

| Field | 必須 | 意味 |
|---|---|---|
| `email` | 必須 | Login と verification に使う email |
| `username` | 必須 | 公開 username |
| `password` | 必須 | Password |
| `gender` | 必須送信 | SDK 既定 `OTHER` |
| `birthday` | 必須送信 | `YYYY-MM-DD` または `null`。SDK 既定 `2000-01-01` |
| `acceptTerms` | 必須送信 | SDK 既定 `true` |
| `acceptPrivacy` | 必須送信 | SDK 既定 `true` |
| `turnstileToken` | Web で必要 | Cloudflare Turnstile token。Android WebView 経路は空文字を送る |
| `_ts` | 必須送信 | 登録画面開始時刻相当の Unix milliseconds |

Web Turnstile sitekey は `0x4AAAAAACujb-w-3YVWR1zA`、script は `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit` です。

Android WebView 経路は `clientType: android`、`Origin: https://localhost` を使います。登録 body には `deviceId`、`clientType`、`deviceName` を入れません。

### Response

```ts
interface LoginResult {
  message?: string;
  accessToken: string;
  refreshToken?: string;
  sessionId?: string;
  deviceId?: string;
  user: CurrentUser;
}
```

登録成功時は login と同じ token/session response を返します。

## Login

### Request

```ts
interface LoginRequest {
  identifier: string;
  password: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  deviceId: string;
  clientType: "web" | "ios" | "android";
  deviceName: string;
}
```

`identifier` は username または email です。`deviceId` は再利用可能な UUID、`deviceName` は session 一覧に表示する名前です。

### 通常成功

```json
{
  "message": "ログインに成功しました",
  "accessToken": "jwt",
  "refreshToken": "refresh-token",
  "sessionId": "uuid",
  "deviceId": "uuid",
  "user": {
    "id": 1,
    "username": "name",
    "displayName": "Name"
  }
}
```

### 2FA challenge

```ts
interface TwoFactorChallenge {
  twoFactorRequired: true;
  twoFactorToken: string;
}
```

この response は login success ではありません。`twoFactorToken` を access token として保存せず、`POST /auth/login/2fa` へ渡します。SDK はこの response を `TwoFactorRequiredError` に変換し、`error.twoFactorToken` で token を保持します。

## 2FA login

```ts
interface TwoFactorLoginRequest {
  twoFactorToken: string;
  code: string;
  deviceId: string;
  clientType: "web" | "ios" | "android";
  deviceName: string;
}
```

`code` は TOTP または server が許可する recovery code です。成功 response は `LoginResult` です。

## Token refresh

```ts
interface RefreshTokenRequest {
  deviceId: string;
  clientType: "web" | "ios" | "android";
  deviceName: string;
  refreshToken?: string;
}

interface RefreshTokenResponse {
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
}
```

Body の `refreshToken` と `karotter_rt` Cookie のどちらかが必要です。User API の 401 では SDK がこの endpoint を 1 回呼び、成功時だけ元 request を再送します。

## Current user

`GET /auth/me` は `CurrentUser` を直接返します。`{ user: CurrentUser }` envelope ではありません。

以下は主要フィールドの抜粋です。通知、タイムライン、コンテンツ表示、2FA、OAuth 接続、規約確認を含む完全な型は [データスキーマ](./14-schemas.md#user) を参照してください。

```ts
interface CurrentUser extends User {
  email?: string;
  showLikedPosts?: boolean;
  showReadReceipts?: boolean;
  directMessagesEnabled?: boolean;
  onlineStatusVisibility?: string;
}
```

## Logout

```json
{
  "deviceId": "uuid"
}
```

成功後、SDK は access token と refresh token を削除します。Cookie の失効は server の `Set-Cookie` に従います。

## Session

```ts
interface SessionInfo {
  id: string;
  deviceId: string;
  clientType: string;
  deviceName: string;
  userAgent: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent: boolean;
}
```

### Session switch

```ts
interface SwitchSessionRequest {
  sessionId?: string;
  userId?: number;
  deviceId?: string;
  clientType?: "web" | "ios" | "android";
  deviceName?: string;
}

interface SwitchSessionResult {
  accessToken: string;
  refreshToken?: string;
  sessionId: string;
  user: CurrentUser;
}
```

`sessionId` と `userId` の少なくとも一方を使います。`deviceId`、`clientType`、`deviceName` を省略した場合、SDK は認証ストアの端末情報を送ります。成功後は返された token を active token に置き換えます。

### Unread snapshot

```ts
interface SessionUnreadSnapshotInput {
  sessionIds?: string[];
  deviceId?: string;
}
```

```ts
interface SessionUnreadSnapshot {
  sessionId?: string;
  userId?: number;
  notificationsCount?: number;
  dmCount?: number;
  unreadCount?: number;
  capturedAt?: string;
}
```

## Password と email

### Forgot password

```json
{ "email": "user@example.com" }
```

Turnstile field は確認されていません。存在するアカウントの列挙を避けるため、実装側が同じ成功文言を返す可能性があります。

### Reset password

```json
{
  "token": "reset-token",
  "password": "new-password"
}
```

Web SPA は reset URL の query から token を読みます。

### Email 変更

```json
{ "email": "new@example.com" }
```

成功 response:

```ts
interface SetEmailResponse {
  message: string;
  email: string;
  cooldownSeconds?: number;
}
```

## TOTP setup

```ts
interface TwoFactorSetup {
  secret?: string;
  qrCode?: string;
  otpauthUrl?: string;
  [extra: string]: unknown;
}
```

`secret`、`qrCode`、`otpauthUrl` の利用可能な field を返します。Secret は credential なので保存・log 出力しません。

Enable request:

```json
{ "code": "123456" }
```

Enable response:

```ts
interface TwoFactorEnableResult {
  backupCodes: string[];
  message?: string;
}
```

Backup code は再表示されない前提で 1 回だけ安全に保存します。

Disable request:

```ts
interface TwoFactorDisableRequest {
  code?: string;
  password?: string;
}
```

Web SPA 解析では `backupCode` を送る経路も確認されていますが、SDK の型は `code` と `password` を公開しています。Server が受ける field と SDK 型に差があるため、raw request で `backupCode` を使う場合は動作確認が必要です。

## Legal quiz

```ts
interface LegalQuizOption {
  id: string;
  label?: string;
  explanation?: string;
}

interface LegalQuizQuestion {
  id: string;
  options: LegalQuizOption[];
}

interface LegalQuiz {
  token: string;
  questions: LegalQuizQuestion[];
}
```

Grade request:

```ts
interface LegalQuizGradeRequest {
  legalQuizToken: string;
  legalQuizAnswers: Record<string, string>;
}
```

Grade response:

```ts
interface LegalQuizGradeResult {
  passed?: boolean;
  questions?: LegalQuizQuestion[];
}
```

## Google / Discord account OAuth

この OAuth は外部アプリ向け `/oauth/*` とは別です。Karotter account の login/register と provider 接続に使います。

```ts
interface OAuthAccountStartQuery {
  mode: "login" | "register";
  frontendOrigin?: string;
  next?: string;
  addAccount?: boolean;
}
```

- `mode=login`: provider account で login。
- `mode=register`: provider 情報を使って登録。
- `frontendOrigin`: callback 後に戻る frontend origin。
- `next`: frontend 内の遷移先。
- `addAccount=1`: 現在の account list に追加する flow。

Start endpoint は JSON ではなく 302 redirect を返します。Callback の query と最終 redirect は provider/server の状態に依存します。
