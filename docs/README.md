# karotter.js ガイド

karotter.js の公開APIは `karotter` から始めます。HTTP endpointの一覧は [API Reference](./api-reference.md) にあります。

## セッション

```ts
import { karotter } from "karotter.js";

const kt = await karotter.login({
  id: "username-or-email",
  password: "password",
});
```

tokenから始める場合:

```ts
const kt = await karotter.fromToken({
  accessToken,
  refreshToken,
});
```

ログインせずに公開GETだけ使う場合:

```ts
const kt = karotter.create();
```

終了:

```ts
await kt.destroy();
```

## 登録

```ts
const kt = await karotter.register({
  email: "example@example.com",
  username: "example_user",
  password: "password",
});
```

`turnstileToken` を渡した場合はその値を使います。渡さない場合、標準のHTTPクライアントではAndroid登録処理に寄せたtransportを使います。
`gender` は省略時に `"OTHER"`、`birthday` は `"2000-01-01"`、`acceptTerms` / `acceptPrivacy` は `true` になります。

## 投稿

```ts
const post = await kt.post("hello", {
  visibility: "followers",
});

await kt.reply(post, "reply");
await kt.quote(post, "quote");
await kt.like(post);
await kt.delete(post);
```

`Post` オブジェクト、ID文字列、数値IDをそのまま渡せます。

```ts
await kt.reply(post.id, "reply");
await kt.quote("631800", "quote");
```

メディア付き投稿:

```ts
await kt.media("image", [
  { file, alt: "description" },
]);
```

投票:

```ts
await kt.poll("poll", {
  options: ["A", "B"],
  durationHours: 24,
});
```

`visibility` は `"public"`、`"followers"`、`"circle"` を受け付けます。`"circle"` の場合は `viewerCircleId` も渡します。

## タイムライン

```ts
const home = await kt.timeline.home({ limit: 20 });
const latest = await kt.timeline.latest({ limit: 20 });
const following = await kt.timeline.following({ limit: 20 });
const trending = await kt.timeline.trending();
const recommended = await kt.timeline.recommended({ limit: 20 });
```

## 投稿操作

```ts
const post = await kt.posts.fetch(631800);
const replies = await kt.posts.replies(post);
const quotes = await kt.posts.quotes(post);
const likes = await kt.posts.likes(post);

await kt.posts.react(post, "👍");
await kt.posts.unreact(post, "👍");
await kt.posts.bookmark(post);
await kt.posts.unbookmark(post);
```

## ユーザー

```ts
const profile = await kt.users.get("@karon");

await kt.users.follow(profile.user);
await kt.users.unfollow(profile.user);
await kt.users.block(profile.user);
await kt.users.mute(profile.user);
```

`kt.users.follow("@karon")` のようにusernameを渡した場合は、内部でユーザー取得してIDに変換します。

## DM

```ts
const dm = await kt.dm.with("@karon");

await dm.send("hello");
await dm.read();
```

既存グループIDを使う場合:

```ts
const dm = kt.dm.group(123);
const messages = await dm.messages({ limit: 20 });
```

## 検索

```ts
const result = await kt.search.all({ q: "karotter" });
const users = await kt.search.users({ q: "karon" });
const posts = await kt.search.posts({ q: "hello", type: "latest" });
const topics = await kt.search.trendingTopics(5);
```

## その他のAPI

リバースエンジニアリング済みのHTTP endpointは action から触れます。

```ts
await kt.auth.sessions();
await kt.follows.pendingRequests();
await kt.notifications.list({ limit: 20 });
await kt.social.circles();
await kt.radio.active();
await kt.draw.rooms();
await kt.news.list();
await kt.boards.list();
await kt.apiKeys.list();
await kt.developer.posts({ limit: 20 });
await kt.legal.summary();
await kt.misc.report({
  targetType: "POST",
  targetId: 631800,
  reason: "SPAM",
});
```

管理APIは管理者セッション前提です。

```ts
await kt.admin.dashboard();
await kt.admin.users({ limit: 20 });
await kt.admin.reports();
```

## リアルタイム

ログイン時に接続する場合:

```ts
const kt = await karotter.login(
  { id: "username", password: "password" },
  { connect: true },
);
```

後から接続する場合:

```ts
kt.connect();
```

イベント:

```ts
kt.on("notification", (payload) => {
  console.log(payload.type);
});

kt.on("dm:new-message", ({ message }) => {
  console.log(message.content);
});

kt.on("draw:stroke", ({ roomId }) => {
  console.log(roomId);
});
```

## 低レベルリクエスト

未調査の新規endpointや一時的な検証は `request()` で叩けます。

```ts
const response = await kt.request("GET", "/posts/631800");

await kt.request("POST", "/reports", {
  body: {
    targetType: "POST",
    targetId: 631800,
    reason: "SPAM",
  },
});
```

## エラー処理

```ts
import {
  BannedError,
  KarotterError,
  RateLimitError,
  ValidationError,
} from "karotter.js";

try {
  await kt.post("hello");
} catch (error) {
  if (error instanceof BannedError) {
    console.error(error.banReason ?? error.message);
  } else if (error instanceof RateLimitError) {
    console.error(error.retryAfterMs);
  } else if (error instanceof ValidationError) {
    console.error(error.data);
  } else if (error instanceof KarotterError) {
    console.error(error.status, error.message);
  } else {
    throw error;
  }
}
```

## 設定

```ts
const kt = karotter.create({
  baseUrl: "https://api.karotter.com",
  timeoutMs: 15000,
  clientType: "web",
  deviceId: "device-id",
  deviceName: "Node.js",
  acceptLanguage: "ja-JP",
  userAgent: "custom user agent",
  requestedWith: null,
  autoCsrfRetry: true,
  autoTokenRefresh: true,
});
```

`requestedWith` を `null` にすると `X-Requested-With` を送りません。`clientType: "android"` の既定値は `jp.karon.karotter` です。

## TypeScript

配布物はESM、CommonJS、型定義を含みます。ソースはTypeScriptだけです。

```ts
import type { Karotter, Post, PostOptions, RegisterInput } from "karotter.js";
```

ビルド:

```bash
npm run typecheck
npm run build
```
