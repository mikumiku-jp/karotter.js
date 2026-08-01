# Subscription・OAuth 2 API

購読、Gift、OAuth Client 管理、OAuth 2 Authorization Code flow を扱う。

## Subscription endpoint

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/subscriptions/plans` | 任意 | なし | `{ plans: SubscriptionPlan[], badges?: SubscriptionPlan[] }` | Plus・Pro・月額 Badge 一覧 |
| GET | `/subscriptions/me` | 必須 | なし | `SubscriptionOverview` | 現在の購読、権利、商品一覧 |
| POST | `/subscriptions/checkout` | 必須 | `SubscriptionCheckoutInput` | `CheckoutSession` | Checkout 開始または plan 変更 |
| POST | `/subscriptions/portal` | 必須 | なし | `CheckoutSession` | Stripe Customer Portal 作成 |
| PATCH | `/subscriptions/preferences` | 必須 | `SubscriptionPreferences` | `MessageEnvelope` | Badge・装飾設定更新 |
| GET | `/subscriptions/gifts/received` | 必須 | なし | `{ gifts: SubscriptionGift[] }` | 回答待ちを含む受領 Gift 一覧 |
| GET | `/subscriptions/gifts/{giftId}` | 必須 | なし | `{ gift: SubscriptionGift }` | Gift 詳細 |
| POST | `/subscriptions/gifts/checkout` | 必須 | `SubscriptionGiftCheckoutInput` | `CheckoutSession` | 1か月 Gift の Checkout |
| POST | `/subscriptions/gifts/{giftId}/response` | 必須 | `SubscriptionGiftResponseInput` | `SubscriptionGiftResponse` | Gift 受諾・拒否 |

### 商品と購読状態

```ts
type SubscriptionPlanCode = "FREE" | "PLUS" | "PRO" | string;

type SubscriptionProductCode =
  | "PLUS"
  | "PRO"
  | "BADGE_RED"
  | "BADGE_GREEN"
  | string;

type SubscriptionStatus =
  | "ACTIVE"
  | "TRIALING"
  | "INCOMPLETE"
  | "PAST_DUE"
  | "UNPAID"
  | "INACTIVE"
  | "CANCELED"
  | string;

interface SubscriptionPlan {
  id?: number | string;
  code: SubscriptionProductCode;
  name: string;
  type?: "plan" | "badge" | string;
  amount: number;
  currency: string;
  interval: "month" | string;
}

interface SubscriptionRecord {
  id: number | string;
  productCode: SubscriptionProductCode;
  status: SubscriptionStatus;
  isEnabled?: boolean;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string | null;
}
```

`GET /subscriptions/plans` の商品情報を価格・通貨・請求間隔の正とする。2026-08-01 時点の Web UI fallback は Plus が月額400円、Pro が月額1,300円、赤・緑 Badge が各月額100円だが、購入画面では必ず API response を使う。

### 現在の購読と権利

```ts
interface SubscriptionSummary {
  plan: SubscriptionPlanCode;
  status: SubscriptionStatus;
  activeUntil?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  scheduledPlan?: SubscriptionPlanCode | null;
  scheduledPlanEffectiveAt?: string | null;
  badgeColors?: PremiumBadgeColor[];
  showSubscriptionBadges?: boolean;
  showPlusBadge?: boolean;
  showProBadge?: boolean;
  showRedBadge?: boolean;
  showGreenBadge?: boolean;
  showProfileDecoration?: boolean;
  showCardDecoration?: boolean;
  premiumBadgeColor?: PremiumBadgeColor;
  profileAccentColor?: string | null;
  cardAccentColor?: string | null;
}

interface SubscriptionEntitlements {
  postTextLimit: number;
  pinnedPostLimit: number;
  uploadLimitBytes: number | null;
  canCustomizeProfile: boolean;
  canCustomizeCards: boolean;
  replyRankingBoost?: "NONE" | "PLUS" | "PRO";
  canUseProReactions?: boolean;
}

interface SubscriptionOverview {
  summary: SubscriptionSummary;
  entitlements?: SubscriptionEntitlements;
  plans?: SubscriptionPlan[];
  badges?: SubscriptionPlan[];
  subscriptions?: SubscriptionRecord[];
}
```

機能可否は `/subscriptions/me` の `entitlements` を優先する。response に権利がない場合は、SDK の `getActiveSubscriptionPlan()` と `getSubscriptionPlanCapabilities()` で現行 Web UI と同じ既定値を導出できる。

| 機能 | Free | Plus | Pro |
|---|---:|---:|---:|
| 投稿文字数 | 200 | 1,000 | 7,000 |
| 固定投稿数 | 1 | 3 | 5 |
| Upload 上限 | 通常上限 | 通常上限 | 200 MiB |
| 返信表示 boost | なし | あり | より強い |
| Pro 専用 reaction | 不可 | 不可 | 可 |
| Profile・Card 装飾 | 不可 | 不可 | 可 |

Plus はオレンジの確認 Badge を持つ。Pro は Plus の権利を含み、返信 boost が強くなる。Pro は確認 Badge の色を Orange・Black・Red・Green・Pink から選択できる。

投稿文字数上限は投稿・返信 composer に適用される。Pro の 200 MiB 上限は、投稿・返信、Story、Board thread/reply、DM 添付で確認済み。SDK はこれらの upload を一律の小さい上限で拒否しない。通常上限は media 種別と endpoint に依存するため、`getSubscriptionUploadLimit(activePlan, standardLimitBytes)` にその値を渡す。

Pro 専用 reaction は通常の reaction endpoint を使い、code は `pro:` namespace になる。2026-08-01 配信 SPA では投稿、DM、Board thread/reply、Guild message で利用できる。SDK は各 surface の reaction 引数を `ReactionCode` として受け、`isProReactionCode()` で namespace を判定できる。利用権と catalog 登録の最終検証はサーバー側で行われる。

```ts
import {
  getActiveSubscriptionPlan,
  getSubscriptionPlanCapabilities,
  getSubscriptionUploadLimit,
  isProReactionCode,
} from "@mikumiku-jp/karotter.js";

const activePlan = getActiveSubscriptionPlan(client.user);
const capabilities = getSubscriptionPlanCapabilities(activePlan);
const uploadLimitFor = (standardLimitBytes: number) =>
  getSubscriptionUploadLimit(activePlan, standardLimitBytes);

await client.posts.react(postId, "pro:arigato");
await client.dm.group(groupId).react(messageId, "pro:arigato");
await client.boards.reactThread(boardSlug, threadId, "pro:arigato");
await client.channels.reactToMessage(messageId, "pro:arigato");

console.log(capabilities, uploadLimitFor, isProReactionCode("pro:arigato"));
```

固定投稿は単一 slot ではない。`PATCH /users/profile/pinned-post` に `{ postId, pinned }` を送り、`User.pinnedPostIds` と `UserDetail.pinnedPosts` を配列として扱う。

### Checkout・設定

```ts
interface SubscriptionCheckoutInput {
  productCode: SubscriptionProductCode;
}

interface CheckoutSession {
  url?: string;
  sessionId?: string;
  upgraded?: boolean;
  downgradeScheduled?: boolean;
}

interface SubscriptionPreferences {
  premiumBadgeColor?: "ORANGE" | "BLACK" | "RED" | "GREEN" | "PINK" | string;
  showSubscriptionBadges?: boolean;
  showPlusBadge?: boolean;
  showProBadge?: boolean;
  showRedBadge?: boolean;
  showGreenBadge?: boolean;
  showProfileDecoration?: boolean;
  showCardDecoration?: boolean;
  profileAccentColor?: string | null;
  cardAccentColor?: string | null;
}
```

Checkout response に `url` がある場合だけ外部決済へ遷移する。同一顧客内の即時 upgrade では `upgraded`、次回更新時の downgrade では `downgradeScheduled` が返り、`url` がない場合がある。`CheckoutSession.url` は信頼済み Karotter API response から受け取った値だけを開く。

Profile・Card の accent color は Pro の `canCustomizeProfile`・`canCustomizeCards` がある場合だけ送る。現行 Web UI は `#RRGGBB` を受け付ける。

### Subscription Gift

```ts
interface SubscriptionGiftCheckoutInput {
  productCode: SubscriptionProductCode;
  recipientUsername: string;
}

interface SubscriptionGift {
  id: number | string;
  purchaser: User;
  recipient?: User;
  productCode: SubscriptionProductCode;
  status?:
    | "AWAITING_ACCEPTANCE"
    | "ACCEPTED"
    | "REFUND_PENDING"
    | "DECLINED"
    | "REFUNDED"
    | string;
  paidAt?: string | null;
}

interface SubscriptionGiftResponseInput {
  response: "ACCEPT" | "DECLINE";
}

interface SubscriptionGiftResponse {
  accepted?: boolean;
  refunded?: boolean;
  noPaymentRequired?: boolean;
  gift?: SubscriptionGift;
}
```

Gift は1か月分の一回払いで自動更新されない。受取人が `ACCEPT` すると権利が付与され、既存購読中なら現在の期間後へ追加される。`DECLINE` では返金が開始され、`refunded` または `noPaymentRequired` で結果を判定する。

## OAuth Client 管理

Client 管理 endpoint は Client の所有者としてログインしたユーザー session を使う。

| Method | Path | 認証 | Request | Response | 説明 |
|---|---|---|---|---|---|
| GET | `/oauth/clients` | ユーザー | なし | `{ clients: OAuthClient[] }` | 所有 Client 一覧 |
| POST | `/oauth/clients` | ユーザー | `JsonObject` | `{ client: OAuthClient, secret?: string }` | Client 作成 |
| DELETE | `/oauth/clients/{clientId}` | ユーザー | なし | `MessageEnvelope` | Client 削除 |
| POST | `/oauth/clients/{clientId}/secret` | ユーザー | なし | `{ secret: string }` | Secret 再生成 |

```ts
interface OAuthClient {
  id: number | string;
  name: string;
  redirectUris?: string[];
  [extra: string]: unknown;
}
```

Client 作成 payload の完全な field set は未公開。`name`、redirect URI 群に相当する設定が必要になる。平文 secret は作成時または再生成時だけ返る可能性がある。Public Client は secret を安全に保持できないため PKCE を使う。

## OAuth 2 endpoint 一覧

| Method | Path | 認証 | Request | Response |
|---|---|---|---|---|
| GET | `/oauth/authorize` | User session | Query: `OAuthAuthorizeInput` + `response_type=code` | 認可画面または callback redirect |
| POST | `/oauth/token` | Client secret または PKCE | `OAuthTokenInput` | `OAuthTokenResult` |
| GET | `/oauth/userinfo` | OAuth Bearer | なし | `OAuthUserInfo` |

## Authorization endpoint

```http
GET /api/oauth/authorize
  ?response_type=code
  &client_id=<client-id>
  &redirect_uri=<exact-registered-uri>
  &scope=profile%20email%20offline_access
  &state=<random-state>
  &code_challenge=<pkce-challenge>
  &code_challenge_method=S256
```

| Query | 必須 | 説明 |
|---|---:|---|
| `response_type` | はい | `code` 固定 |
| `client_id` | はい | OAuth Client ID |
| `redirect_uri` | はい | 登録済み URI と一致させる |
| `scope` | いいえ | 空白区切り。確認済み: `profile`, `email`, `offline_access` |
| `state` | 強く推奨 | CSRF・response 取り違え防止用のランダム値 |
| `code_challenge` | Public Client では必須 | PKCE challenge |
| `code_challenge_method` | challenge 使用時 | `S256` 推奨。`plain` も対応 |

ユーザーは認可画面で scope を確認し、成功すると `redirect_uri` へ `code` と `state` が付与される。Client は受信した `state` を開始時の値と定数時間比較する。

## Token endpoint

```http
POST /api/oauth/token
Content-Type: application/json
```

この endpoint にユーザー access token は送らない。SDK は Authorization header を明示的に外し、session refresh も無効にする。

### Authorization code exchange

```json
{
  "grant_type": "authorization_code",
  "code": "authorization-code",
  "redirect_uri": "https://client.example/callback",
  "client_id": "client-id",
  "client_secret": "confidential-client-only",
  "code_verifier": "pkce-verifier"
}
```

- `code`、`redirect_uri`、`client_id` は認可 request と対応させる。
- Confidential Client は `client_secret`、Public Client は `code_verifier` を使う。
- Authorization code は短命・一回限りとして扱う。

### Refresh token exchange

```json
{
  "grant_type": "refresh_token",
  "refresh_token": "refresh-token",
  "client_id": "client-id",
  "client_secret": "confidential-client-only"
}
```

`refresh_token` は `offline_access` scope を認可した場合に発行される可能性がある。refresh response に新しい refresh token が含まれた場合は、古い値と原子的に置換する。

### Token response

```ts
interface OAuthTokenResult {
  access_token: string;
  token_type: "Bearer" | string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
}
```

`expires_in` は秒。access token は `Authorization: Bearer <access_token>` で送る。

## UserInfo endpoint

```http
GET /api/oauth/userinfo
Authorization: Bearer <oauth-access-token>
```

```ts
interface OAuthUserInfo {
  sub: string;
  id: number;
  username: string;
  displayName: string;
  picture?: string | null;
  email?: string;
  email_verified?: boolean;
}
```

`email` と `email_verified` は `email` scope が認可された場合だけ返る。`sub` を外部 Client 側の安定した主体識別子として使い、username を主キーにしない。

## Security checklist

1. `redirect_uri` は登録済み URI と完全一致させる。prefix・部分一致を許可しない。
2. Web/Native Public Client は PKCE `S256` を使う。
3. `state` を request ごとに生成し、callback で検証する。
4. Client secret、access token、refresh token を URL、ログ、ブラウザ永続領域へ露出しない。
5. scope は必要最小限にする。
6. Client secret 再生成時は旧 secret を廃止する前提で全配置先を同時に切り替える。
