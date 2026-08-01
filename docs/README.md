# karotter.js 利用ガイド

このガイドは `@mikumiku-jp/karotter.js` の高レベル API を、認証から最新機能まで順に説明します。2026-08-01 時点の `karotter.com` 配信 SPA と SDK 実装を基準にしています。

## インストール

```bash
npm install @mikumiku-jp/karotter.js
```

Node.js 18 以降が必要です。ESM と CommonJS の両方から利用できます。

```ts
import { karotter } from "@mikumiku-jp/karotter.js";

const client = karotter.create();
```

## 認証

### ログイン

```ts
await client.login({
  id: process.env.KAROTTER_IDENTIFIER ?? "",
  password: process.env.KAROTTER_PASSWORD ?? "",
});

console.log(client.user, client.isLoggedIn);
```

ログイン済みクライアントを直接得る場合はファクトリを使えます。

```ts
const client = await karotter.login({
  id: process.env.KAROTTER_IDENTIFIER ?? "",
  password: process.env.KAROTTER_PASSWORD ?? "",
});
```

### 2段階認証

`/auth/login` が `twoFactorRequired: true` を返すと、SDK は `TwoFactorRequiredError` を送出します。`twoFactorToken` を使って同じクライアント上で認証を完了してください。

```ts
import { TwoFactorRequiredError, karotter } from "@mikumiku-jp/karotter.js";

const client = karotter.create();

try {
  await client.login({ id: "username", password: "password" });
} catch (error) {
  if (!(error instanceof TwoFactorRequiredError)) throw error;

  await client.loginWithTwoFactor({
    twoFactorToken: error.twoFactorToken,
    code: "123456",
  });
}
```

2FA の有効化時は setup 情報を認証アプリへ登録し、コードを検証します。

```ts
const setup = await client.auth.setupTwoFactor();
const enabled = await client.auth.enableTwoFactor("123456");

console.log(setup.secret, setup.otpauthUrl);
console.log(enabled.backupCodes);

await client.auth.disableTwoFactor({ code: "123456" });
```

### Token から開始

```ts
const client = await karotter.fromToken({
  accessToken: process.env.KAROTTER_ACCESS_TOKEN ?? "",
  refreshToken: process.env.KAROTTER_REFRESH_TOKEN,
});
```

`useToken()` と `fromToken()` は `/auth/me` を呼び、現在ユーザーを確定します。

### 登録

```ts
const client = await karotter.register({
  email: "user@example.com",
  username: "example_user",
  password: "strong-password",
});
```

`turnstileToken` がない場合は Android 登録通信を利用します。独自 `axiosInstance` を渡した場合は Android transport を利用できません。

### セッション、規約クイズ、OAuth 接続

```ts
const sessions = await client.auth.sessions();
await client.auth.revokeSession(sessions.sessions[0]?.id ?? "");

const quiz = await client.auth.legalQuiz();
await client.auth.gradeLegalQuiz({
  legalQuizToken: quiz.token,
  legalQuizAnswers: {},
});

await client.auth.disconnectOAuth("discord");
```

OAuth Client の作成・Secret 再生成は `client.oauth`、Google・Discord のログイン開始 URL は `client.auth.oauthUrl()` を使います。

## 投稿

### 作成

```ts
const post = await client.post("hello", {
  visibility: "public",
  replyRestriction: "everyone",
});

await client.reply(post, "reply");
await client.quote(post, "quote");
```

```ts
await client.media("image", [{ file, alt: "description" }]);

await client.poll("poll", {
  options: ["A", "B"],
  durationHours: 24,
  isAnonymous: true,
});
```

### 操作

```ts
await client.posts.like(post);
await client.posts.repost(post);
await client.posts.bookmark(post);
await client.posts.react(post, "👍");
await client.posts.vote(post, 1);

const translation = await client.posts.translate(post, "en");
console.log(translation.translatedText);
```

### 予約投稿と下書き

```ts
const scheduled = await client.posts.scheduled();
const first = scheduled.scheduledPosts[0];

if (first) {
  await client.posts.updateScheduled(first, {
    content: "updated",
    scheduledFor: new Date(Date.now() + 3_600_000).toISOString(),
  });
}

await client.posts.createDraft({ content: "draft" });
```

## タイムライン

```ts
const home = await client.timeline.home({ mode: "latest", limit: 20 });
const recommended = await client.timeline.recommended({ limit: 20 });
const publicFeed = await client.timeline.public({
  kind: "recommended",
  mode: "algorithm",
  limit: 20,
});

await client.posts.reportPublicFeedViews(
  publicFeed.posts.slice(0, 10),
);
```

`/v2/feed/views` に失敗する環境では、従来の `client.posts.reportViews()` を利用できます。

## ユーザーとフォロー

```ts
const user = await client.users.get("username");
const followers = await client.users.followers(user);
const ranking = await client.users.levelRanking({ limit: 20 });

await client.follows.follow(user);
await client.follows.mute(user);
await client.follows.hideRekarots(user);
```

`ResourceTarget` を受けるメソッドには数値 ID、username、`{ id }` を渡せます。username は必要に応じて SDK が `/users/{username}` で ID に解決します。

## Community

```ts
const form = new FormData();
form.append("name", "TypeScript");
form.append("description", "TypeScript community");
form.append("joinType", "OPEN");

const { community } = await client.communities.create(form);
const detail = await client.communities.fetch(community.id);
const members = await client.communities.members(community.id, { limit: 100 });
const posts = await client.communities.posts(community.id, {
  tab: "latest",
  limit: 20,
});

await client.communities.join(community.id);
await client.communities.addToHomeTimeline(community.id);
```

管理権限がある場合はメンバーの Role、所有権移譲、ルール、非表示投稿、Community 内レポートを操作できます。

```ts
await client.communities.updateMemberRole(community.id, 42, "MODERATOR");
await client.communities.updateRules(community.id, {
  rules: ["Be kind"],
});
await client.communities.reorderHomeTimelines([community.id]);
```

Community 検索は `client.search.communities({ q: "TypeScript" })` です。

## Guild、Channel、Guild Bot

### Guild

```ts
const { guild } = await client.guilds.create({ name: "Developers" });
const { channel } = await client.guilds.createChannel(guild.id, {
  name: "general",
  type: "TEXT",
});

const members = await client.guilds.members(guild.id, { limit: 200 });
const roles = await client.guilds.roles(guild.id);
```

Guild API は Invite、Ban、Role、Event、Audit Log、Channel 並び替え、Voice State を扱います。

```ts
const { invite } = await client.guilds.createInvite(guild.id, {
  maxUses: 10,
});

await client.guilds.acceptInvite(invite.code);
await client.guilds.createRole(guild.id, { name: "Maintainer" });
```

### Channel

```ts
await client.channels.sendMessage(channel.id, {
  content: "hello",
});

const messages = await client.channels.messages(channel.id, { limit: 50 });
await client.channels.reactToMessage(messages.messages[0]?.id ?? 0, "👍");
```

Stage、Voice、Forum にも対応します。

```ts
await client.channels.joinVoice(channel.id);
await client.channels.createStage(channel.id, { topic: "Weekly sync" });
await client.channels.createForumPost(channel.id, {
  title: "RFC",
  content: "proposal",
});
```

### Guild Bot

```ts
const created = await client.guildBots.createApplication({
  name: "release-bot",
});

const applications = await client.guildBots.applications();
const token = await client.guildBots.regenerateToken(created.application.id);

console.log(applications.applications, token.token);
```

Token はレスポンスで返された時点で安全に保存してください。

Bot Token を使う Bot API は、Application 管理 API と認証方式が異なります。

```ts
const botClient = karotter.create({
  botToken: process.env.KAROTTER_BOT_TOKEN,
});

const guilds = await botClient.bot.guilds();
const guildId = guilds.guilds[0]?.id ?? 0;
const channels = await botClient.bot.channels(guildId);

await botClient.bot.sendMessage(channels.channels[0]?.id ?? 0, "hello");
await botClient.bot.upsertCommand({
  name: "ping",
  description: "Reply with pong",
});
```

## DM と通知

```ts
const conversation = await client.dm.with("username");
await conversation.send("hello");

const unread = await client.dm.unreadCount();
const notifications = await client.notifications.list({ limit: 30 });

console.log(unread, notifications.notifications);
```

```ts
await conversation.startCall();
await conversation.joinCall();
await conversation.leaveCall();
```

## Subscription と OAuth Client

```ts
const plans = await client.subscriptions.plans();
const current = await client.subscriptions.me();

const checkout = await client.subscriptions.checkout({
  planId: plans.plans[0]?.id ?? "",
});

console.log(current.summary, checkout.url);
```

Gift と Portal も同じ API グループにあります。

```ts
const gifts = await client.subscriptions.receivedGifts();
await client.subscriptions.respondToGift(gifts.gifts[0]?.id ?? "", {
  action: "ACCEPT",
});

const portal = await client.subscriptions.portal();
console.log(portal.url);
```

OAuth Client:

```ts
const created = await client.oauth.createClient({
  name: "my-app",
  redirectUris: ["https://example.com/callback"],
});

const secret = await client.oauth.regenerateClientSecret(created.client.id);
console.log(secret.secret);
```

OAuth 2 認可コードフロー:

```ts
const code = process.env.KAROTTER_OAUTH_CODE ?? "";
const codeVerifier = process.env.KAROTTER_OAUTH_CODE_VERIFIER ?? "";
const codeChallenge = process.env.KAROTTER_OAUTH_CODE_CHALLENGE ?? "";
const authorizeUrl = client.oauth.authorizeUrl({
  clientId: process.env.KAROTTER_OAUTH_CLIENT_ID ?? "",
  redirectUri: "https://example.com/callback",
  scope: "profile email offline_access",
  state: crypto.randomUUID(),
  codeChallenge,
  codeChallengeMethod: "S256",
});

const token = await client.oauth.exchangeToken({
  grant_type: "authorization_code",
  code,
  redirect_uri: "https://example.com/callback",
  client_id: process.env.KAROTTER_OAUTH_CLIENT_ID,
  code_verifier: codeVerifier,
});

const profile = await client.oauth.userInfo(token.access_token);
```

## 公開 Developer API

`client.developer` は API Key 向けの `/developer` API を公開します。投稿、タイムライン、ユーザー、フォロー申請、ニュース、Story、Board、DM、通知、レスポンス Schema、Twitter v2 互換 API を扱えます。

```ts
const apiClient = karotter.create({
  accessToken: process.env.KAROTTER_API_KEY,
});

const timeline = await apiClient.developer.timeline({ limit: 20 });
const post = await apiClient.developer.createPost({ content: "API post" });
const schema = await apiClient.developer.postSchema();
const tweets = await apiClient.developer.v2.searchRecent({
  query: "karotter",
});
```

## Radio と Draw

const spaceId = Number(process.env.KAROTTER_SPACE_ID ?? "0");
const token = await client.radio.realtimeToken(spaceId);
await client.radio.join(spaceId);

console.log(token.token);

const roomId = process.env.KAROTTER_DRAW_ROOM_ID ?? "";
const token = await client.draw.realtimeToken(roomId);
await client.draw.joinRoom(roomId);

console.log(token.token);

## リアルタイム

```ts
client
  .on("dm:new-message", ({ message }) => console.log(message))
  .on("notification", (notification) => console.log(notification))
  .on("guild:message-create", ({ channelId, message }) => {
    console.log(channelId, message);
  });

client.connect();
```

`client.disconnect()` で Socket.IO 接続だけを切断し、`client.destroy()` で接続と認証状態を破棄します。

## 低レベルリクエスト

```ts
const response = await client.request<{ message: string }>(
  "PATCH",
  "/users/settings",
  {
    body: { showReadReceipts: false },
    query: { source: "sdk" },
  },
);
```

`request()` でも認証ヘッダ、Cookie、CSRF、自動 Token refresh、エラー正規化が適用されます。

## 設定

```ts
const client = karotter.create({
  baseUrl: "https://api.karotter.com",
  timeoutMs: 20_000,
  clientType: "web",
  deviceName: "CLI",
  accessToken: process.env.KAROTTER_ACCESS_TOKEN,
  refreshToken: process.env.KAROTTER_REFRESH_TOKEN,
  autoCsrfRetry: true,
  autoTokenRefresh: true,
  botToken: process.env.KAROTTER_BOT_TOKEN,
  connect: false,
});
```

`baseUrl` に `/api` は付けません。独自 `axiosInstance` を渡す場合は `baseURL` と Cookie 管理を呼び出し側で整合させてください。

## エラー処理

```ts
import {
  KarotterError,
  RateLimitError,
  TwoFactorRequiredError,
} from "@mikumiku-jp/karotter.js";

try {
  await client.timeline.home();
} catch (error) {
  if (error instanceof TwoFactorRequiredError) {
    console.error(error.twoFactorToken);
  } else if (error instanceof RateLimitError) {
    console.error(error.retryAfterMs);
  } else if (error instanceof KarotterError) {
    console.error(error.status, error.code, error.data);
  } else {
    throw error;
  }
}
```

## 関連文書

- [SDK リファレンス](./karotter-js.md)
- [HTTP API リファレンス](./api-reference.md)
- [HTTP・認証・リアルタイム仕様](./api-spec.md)
