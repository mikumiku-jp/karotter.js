# karotter.js

Karotter の Web API と Socket.IO を TypeScript から扱うクライアントです。Node.js 18 以降に対応し、ESM・CommonJS・型定義を同梱します。

2026-08-01 時点の `karotter.com` 配信 SPA を解析し、Community、Guild、Channel、Guild Bot、Subscription、OAuth 2、2FA、公開フィード、Developer API へ追従しています。内部 API は予告なく変更される可能性があるため、利用時はエラー処理を入れてください。

```bash
npm install @mikumiku-jp/karotter.js
```

## 最短例

```ts
import { karotter } from "@mikumiku-jp/karotter.js";

const client = await karotter.login({
  id: process.env.KAROTTER_IDENTIFIER ?? "",
  password: process.env.KAROTTER_PASSWORD ?? "",
});

const timeline = await client.timeline.home({ limit: 20 });

for (const post of timeline.posts) {
  console.log(`@${post.author.username}: ${post.content}`);
}

await client.destroy();
```

## 2段階認証

2FA が有効なアカウントでは `login()` が `TwoFactorRequiredError` を送出します。例外が保持する `twoFactorToken` と認証コードでログインを完了します。

```ts
import {
  TwoFactorRequiredError,
  karotter,
} from "@mikumiku-jp/karotter.js";

const client = karotter.create();

try {
  await client.login({
    id: process.env.KAROTTER_IDENTIFIER ?? "",
    password: process.env.KAROTTER_PASSWORD ?? "",
  });
} catch (error) {
  if (!(error instanceof TwoFactorRequiredError)) throw error;

  await client.loginWithTwoFactor({
    twoFactorToken: error.twoFactorToken,
    code: process.env.KAROTTER_2FA_CODE ?? "",
  });
}
```

2FA の設定と解除は `client.auth` から操作します。

```ts
const setup = await client.auth.setupTwoFactor();
const enabled = await client.auth.enableTwoFactor("123456");
await client.auth.disableTwoFactor({ code: "123456" });

console.log(setup.otpauthUrl, enabled.backupCodes);
```

## 投稿とタイムライン

```ts
const post = await client.post("hello karotter", {
  visibility: "followers",
});

await client.reply(post, "reply");
await client.quote(post, "quote");
await client.like(post);

const translated = await client.posts.translate(post, "en");
const publicFeed = await client.timeline.public({
  kind: "recommended",
  mode: "algorithm",
  limit: 20,
});

console.log(translated.translatedText, publicFeed.posts.length);
```

メディアと投票にも対応します。

```ts
await client.media("image", [{ file }], {
  visibility: "followers",
});

await client.poll("poll", {
  options: ["A", "B"],
  durationHours: 24,
});
```

## Community

Community の作成・更新は画像を含められるため、`JsonObject` または `FormData` を受け取ります。

```ts
const form = new FormData();
form.append("name", "TypeScript");
form.append("description", "TypeScript users");
form.append("joinType", "OPEN");

const { community } = await client.communities.create(form);
await client.communities.join(community.id);

const posts = await client.communities.posts(community.id, {
  tab: "latest",
  limit: 20,
});
```

## Guild と Channel

```ts
const { guild } = await client.guilds.create({ name: "Developers" });
const { channel } = await client.guilds.createChannel(guild.id, {
  name: "general",
  type: "TEXT",
});

await client.channels.sendMessage(channel.id, {
  content: "hello guild",
});

const messages = await client.channels.messages(channel.id, { limit: 50 });
```

Guild Bot は専用 API から管理します。

```ts
const { application, token } = await client.guildBots.createApplication({
  name: "release-bot",
});

const rotated = await client.guildBots.regenerateToken(application.id);
console.log(token, rotated.token);
```

Bot Token を使って Guild に参加する Bot は `botToken` と `client.bot` を使います。

```ts
const botClient = karotter.create({
  botToken: process.env.KAROTTER_BOT_TOKEN,
});

const guilds = await botClient.bot.guilds();
const channels = await botClient.bot.channels(guilds.guilds[0]?.id ?? 0);

await botClient.bot.sendMessage(channels.channels[0]?.id ?? 0, "release complete");
await botClient.bot.upsertCommand({
  name: "status",
  description: "Show service status",
});
```

## Subscription、Pro、非公開アカウント

```ts
import {
  getActiveSubscriptionPlan,
  getSubscriptionPlanCapabilities,
} from "@mikumiku-jp/karotter.js";

const catalog = await client.subscriptions.plans();
const subscription = await client.subscriptions.me();
const activePlan = getActiveSubscriptionPlan(client.user);
const capabilities = getSubscriptionPlanCapabilities(activePlan);

const postId = 123;
const messageId = 456;
const groupId = 234;
const boardSlug = "typescript";
const threadId = 789;

await client.users.setPinnedPost(postId, true);
await client.posts.react(postId, "pro:arigato");
await client.dm.group(groupId).react(messageId, "pro:arigato");
await client.boards.reactThread(boardSlug, threadId, "pro:arigato");
await client.channels.reactToMessage(messageId, "pro:arigato");

console.log(catalog, subscription, capabilities);
```

Plus・Pro の Checkout、Gift、Badge、Profile・Card 装飾に加え、投稿文字数、複数固定、返信 boost、Pro upload 上限、投稿・DM・Board・Guild の Pro reaction を型付きで扱えます。

非公開アカウントは設定、フォロー申請、承認・拒否、follower 削除、公開範囲を扱えます。

```ts
await client.users.updateSettings({
  isPrivate: true,
  showLikedPosts: false,
  dmRequestPolicy: "FOLLOWERS_ONLY",
});

const { requests } = await client.follows.pendingRequests();
const request = requests[0];

if (request) {
  await client.follows.respondToRequest(request, "accept");
}
```

## セッション、DM、通知

```ts
const sessions = await client.auth.sessions();
const sessionIds = sessions.sessions.map((session) => session.id);
const snapshots = await client.auth.unreadSnapshots({ sessionIds });

const group = await client.dm.createGroup(["alice", "bob"], {
  name: "release team",
  isGroup: true,
});

const notifications = await client.notifications.list({
  page: 1,
  limit: 30,
  types: ["MENTION", "DM"],
});
await client.notifications.readAll({ types: ["MENTION", "DM"] });
await client.notifications.registerPush({ token: "push-token" });

console.log(group.id, snapshots.snapshots, notifications.notifications);
```

セッション切替と未読 snapshot は端末情報を自動補完します。通知種別は一覧と一括既読の query に comma 区切りで送信し、Push 登録は `platform` と `deviceId` を自動補完します。

OAuth 2 認可コードフロー、PKCE、Token 更新、UserInfo にも対応します。

```ts
const code = process.env.KAROTTER_OAUTH_CODE ?? "";
const codeVerifier = process.env.KAROTTER_OAUTH_CODE_VERIFIER ?? "";
const codeChallenge = process.env.KAROTTER_OAUTH_CODE_CHALLENGE ?? "";
const authorizeUrl = client.oauth.authorizeUrl({
  clientId: process.env.KAROTTER_OAUTH_CLIENT_ID ?? "",
  redirectUri: "https://example.com/callback",
  scope: "profile email offline_access",
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

Checkout・Portal・Gift は Stripe のリダイレクト URL を返すことがあります。URL の遷移は呼び出し側で行います。

## 登録

```ts
const client = await karotter.register({
  email: "example@example.com",
  username: "example_user",
  password: "change-this-password",
});
```

`turnstileToken` を省略し、標準の HTTP クライアントを使う場合は Android 登録通信を使用します。`gender` は `"OTHER"`、`birthday` は `"2000-01-01"`、`acceptTerms` と `acceptPrivacy` は `true` が既定値です。

## リアルタイム

```ts
client.on("dm:new-message", ({ message }) => {
  console.log(message);
});

client.on("guild:message-create", ({ channelId, message }) => {
  console.log(channelId, message);
});

client.connect();
```

型付きイベント名と payload は `src/realtime/events.ts` から公開されています。明示的に接続するか、`{ connect: true }` を指定してください。

## API グループ

| プロパティ | 主な用途 |
|---|---|
| `auth` | CSRF、セッション、2FA、規約クイズ、OAuth 接続解除 |
| `posts`, `timeline` | 投稿、公開フィード、予約投稿、翻訳、下書き |
| `users`, `follows` | ユーザー、非公開設定、フォロー申請、ブロック、ミュート |
| `dm`, `notifications` | DM、通話、未読数、通知、Push |
| `search`, `social` | 検索、Community 検索、Circle、List、Story、質問 |
| `communities` | Community、メンバー、ルール、レポート、ホーム表示 |
| `guilds`, `channels` | Guild、Role、Invite、Channel、Stage、Forum、Voice |
| `guildBots`, `bot` | Guild Bot Application・Token、Bot Token API |
| `radio`, `draw` | Space、リアルタイム Token、絵チャット |
| `news`, `boards` | ニュースと掲示板 |
| `subscriptions`, `oauth` | Plus・Pro、権利、装飾、Gift、OAuth Client、OAuth 2 認可コードフロー |
| `apiKeys`, `developer` | API Key、公開 Developer API、Schema、Twitter v2 互換 API |
| `legal`, `misc`, `admin` | 規約、通報、音声アップロード、管理 API |

未知または新設直後の endpoint は低レベル API で呼び出せます。

```ts
const response = await client.request<{ message: string }>(
  "POST",
  "/new-endpoint",
  { body: { enabled: true } },
);
```

## エラー

```ts
import {
  KarotterError,
  RateLimitError,
} from "@mikumiku-jp/karotter.js";

try {
  await client.timeline.home();
} catch (error) {
  if (error instanceof RateLimitError) {
    console.error(error.retryAfterMs);
  } else if (error instanceof KarotterError) {
    console.error(error.status, error.code, error.data);
  } else {
    throw error;
  }
}
```

## ドキュメント

- [利用ガイド](./docs/README.md)
- [SDK リファレンス](./docs/karotter-js.md)
- [Karotter API リファレンス](./docs/karotter-api/README.md)

## 開発

```bash
npm ci
npm run typecheck
npm run build
node scripts/smoke.mjs
```

## ライセンス

[GNU Affero General Public License v3.0 only](./LICENSE)
