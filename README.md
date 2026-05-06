# karotter.js

Karotter API を TypeScript から扱うためのクライアントです。公開APIは `karotter.login()` から始める形です。

このREADMEと `docs/` 配下のドキュメントはAIが作成しています。実装と挙動に差がある場合は、ソースコード側を優先してください。

```bash
npm install @mikumiku-jp/karotter.js
```

## 使い方

```ts
import { karotter } from "@mikumiku-jp/karotter.js";

const kt = await karotter.login({
  id: process.env.KAROTTER_IDENTIFIER ?? "",
  password: process.env.KAROTTER_PASSWORD ?? "",
});

const home = await kt.timeline.home({ limit: 20 });

for (const post of home.posts) {
  console.log(`@${post.author.username}: ${post.content}`);
}

await kt.destroy();
```

## 投稿

```ts
const post = await kt.post("hello karotter", {
  visibility: "followers",
});

await kt.reply(post, "reply");
await kt.quote(post, "quote");
await kt.like(post);
await kt.delete(post);
```

メディアと投票:

```ts
await kt.media("image", [{ file }], {
  visibility: "followers",
});

await kt.poll("poll", {
  options: ["A", "B"],
  durationHours: 24,
});
```

## 登録

```ts
const kt = await karotter.register({
  email: "example@example.com",
  username: "example_user",
  password: "change-this-password",
});

console.log(kt.user?.id);
```

`turnstileToken` を省略し、標準のHTTPクライアントを使っている場合はAndroid登録処理に寄せた通信を使います。`turnstileToken` または独自の `axiosInstance` を渡した場合は通常のRESTリクエストを送ります。
`gender` は省略時に `"OTHER"`、`birthday` は `"2000-01-01"`、`acceptTerms` / `acceptPrivacy` は `true` になります。

## よく使うAPI

```ts
await kt.posts.fetch(post);
await kt.posts.replies(post);
await kt.posts.quotes(post);
await kt.posts.bookmark(post);

await kt.users.get("@karon");
await kt.users.follow("@karon");
await kt.users.mute("@karon");

const dm = await kt.dm.with("@karon");
await dm.send("hello");

await kt.news.list();
await kt.boards.list();
await kt.notifications.list({ limit: 20 });
await kt.apiKeys.list();
```

リアルタイムイベント:

```ts
const kt = await karotter.login(
  { id, password },
  { connect: true },
);

kt.on("dm:new-message", ({ message }) => {
  console.log(message.content);
});
```

既知のHTTP endpointは `kt.auth`、`kt.posts`、`kt.timeline`、`kt.users`、`kt.follows`、`kt.dm`、`kt.notifications`、`kt.search`、`kt.social`、`kt.radio`、`kt.draw`、`kt.news`、`kt.boards`、`kt.apiKeys`、`kt.developer`、`kt.legal`、`kt.misc`、`kt.admin` から扱えます。

未調査の新規endpointや一時的な検証には `request()` も残しています。

```ts
const raw = await kt.request("GET", "/posts/631800");
```

## エラー

HTTPエラーは `KarotterError` 系に変換されます。

```ts
import { BannedError, RateLimitError } from "@mikumiku-jp/karotter.js";

try {
  await kt.post("hello");
} catch (error) {
  if (error instanceof BannedError) {
    console.error(error.banReason ?? error.message);
  } else if (error instanceof RateLimitError) {
    console.error(error.retryAfterMs);
  } else {
    throw error;
  }
}
```

## ドキュメント

| ドキュメント | 内容 |
|---|---|
| [docs/README.md](./docs/README.md) | karotter.js の使い方 |
| [docs/karotter-js.md](./docs/karotter-js.md) | SDKの説明書、公開メソッド一覧、payload、エラー |
| [docs/api-reference.md](./docs/api-reference.md) | リバースエンジニアリングで確認したHTTP API |
| [docs/api-spec.md](./docs/api-spec.md) | 解析メモ寄りの内部仕様 |

## 開発

`src` は TypeScript のみです。ビルド後に `dist/esm`、`dist/cjs`、`dist/types` が生成されます。

```bash
npm run typecheck
npm run build
```

## ライセンス

MIT
