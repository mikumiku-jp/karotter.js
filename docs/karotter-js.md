# karotter.js 説明書

`@mikumiku-jp/karotter.js` は Karotter の非公式 TypeScript SDK です。高レベルな `karotter` API と、解析済みendpointを包んだ `kt.*` 名前空間を提供します。

このドキュメントはAIが作成しています。実装と差がある場合は `src/` と配布される型定義を優先してください。

## インストール

```bash
npm install @mikumiku-jp/karotter.js
```

```ts
import { karotter } from "@mikumiku-jp/karotter.js";
```

Node.js 18以降が必要です。ESM、CommonJS、型定義を同梱しています。

## 最短例

```ts
import { karotter } from "@mikumiku-jp/karotter.js";

const kt = await karotter.login({
  id: process.env.KAROTTER_IDENTIFIER ?? "",
  password: process.env.KAROTTER_PASSWORD ?? "",
});

const post = await kt.post("hello", {
  visibility: "followers",
});

console.log(post.id);
await kt.destroy();
```

## 入口API

| API | 引数 | 戻り値 | 内容 |
|---|---|---|---|
| `karotter.create(options?)` | `KarotterOptions` | `Karotter` | 未ログインまたは手動ログイン用のインスタンス |
| `karotter.login(input, options?)` | `LoginOptions`, `KarotterOptions` | `Promise<Karotter>` | ログイン済みインスタンス |
| `karotter.register(input, options?)` | `RegisterInput`, `KarotterOptions` | `Promise<Karotter>` | 登録してログイン済みインスタンス |
| `karotter.fromToken(input, options?)` | `TokenLoginOptions`, `KarotterOptions` | `Promise<Karotter>` | 既存tokenから開始 |
| `new Karotter(options?)` | `KarotterOptions` | `Karotter` | クラスを直接作成 |

### `KarotterOptions`

```ts
interface KarotterOptions {
  baseUrl?: string;
  timeoutMs?: number;
  accessToken?: string | null;
  refreshToken?: string | null;
  csrfToken?: string | null;
  deviceId?: string;
  clientType?: "web" | "ios" | "android" | string;
  deviceName?: string;
  userAgent?: string;
  acceptLanguage?: string;
  requestedWith?: string | null;
  autoTokenRefresh?: boolean;
  autoCsrfRetry?: boolean;
  axiosInstance?: unknown;
  gateway?: GatewayOptions;
  connect?: boolean;
}
```

`requestedWith: null` を渡すと `X-Requested-With` を送りません。`connect: true` はログイン後にWebSocketへ接続します。

## 認証

### ログイン

```ts
const kt = await karotter.login({
  id: "username-or-email",
  password: "password",
});
```

```ts
interface LoginOptions {
  id: string;
  password: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | string;
}
```

### 登録

```ts
const kt = await karotter.register({
  email: "user@example.com",
  username: "user_name",
  password: "password",
});
```

```ts
interface RegisterInput {
  username: string;
  email: string;
  password: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | string;
  birthday?: string;
  acceptTerms?: boolean;
  acceptPrivacy?: boolean;
  turnstileToken?: string;
  registerStartedAtMs?: number;
}
```

`email`、`username`、`password` だけ必須です。省略時は `gender: "OTHER"`、`birthday: "2000-01-01"`、`acceptTerms: true`、`acceptPrivacy: true` を送ります。`turnstileToken` を省略し、標準HTTPクライアントを使う場合はAndroid登録処理に寄せたtransportを使います。

### tokenから開始

```ts
const kt = await karotter.fromToken({
  accessToken: "jwt",
  refreshToken: "refresh-token",
});
```

```ts
interface TokenLoginOptions {
  accessToken: string;
  refreshToken?: string | null;
}
```

## 投稿Payload

### 通常投稿

```ts
const post = await kt.post("本文", {
  visibility: "followers",
  replyRestriction: "everyone",
});
```

### メディア付き投稿

```ts
await kt.media("画像つき", [
  {
    file,
    alt: "説明",
    spoiler: false,
    r18: false,
  },
]);
```

### 投票付き投稿

```ts
await kt.poll("どれ？", {
  options: ["A", "B"],
  durationHours: 24,
  isAnonymous: false,
});
```

### 返信と引用

```ts
await kt.reply(post, "返信");
await kt.quote(post.id, "引用");
```

### `PostOptions`

```ts
interface PostOptions {
  parentId?: string | number;
  quotedPostId?: string | number;
  questionId?: string | number;
  excludedMentions?: number[];
  isAiGenerated?: boolean;
  isPromotional?: boolean;
  isR18?: boolean;
  hideFromMinors?: boolean;
  minimumAge?: number | null;
  maximumAge?: number | null;
  visibility?: "public" | "followers" | "circle" | "PUBLIC" | "FOLLOWERS" | "CIRCLE";
  viewerCircleId?: string | number;
  replyRestriction?: "everyone" | "following" | "mentioned" | "circle" | "EVERYONE" | "FOLLOWING" | "MENTIONED" | "CIRCLE";
  replyCircleId?: string | number;
  scheduledFor?: Date | string;
  poll?: PollDraft;
  media?: MediaAttachment[];
}
```

`kt.post()`、`kt.reply()`、`kt.quote()` は本文必須です。`kt.media()` は本文なしでもmediaがあれば送れます。`visibility: "circle"` の場合は `viewerCircleId` が必要です。`replyRestriction: "circle"` の場合は `replyCircleId` が必要です。

投稿payloadは実サイトの通常投稿に寄せています。`visibility` 未指定時は `PUBLIC`、`replyRestriction` 未指定時は `EVERYONE` を送信します。`isAiGenerated`、`isPromotional`、`isR18`、`hideFromMinors` は未指定なら `false` を送ります。`minimumAge >= 18` の場合だけ、`isR18` と `hideFromMinors` の未指定値は `true` になります。

media関連の配列はmediaなしでも送ります。`mediaAlts=[]`、`mediaSpoilerFlags=[]`、`mediaR18Flags=[]` です。pollを指定した場合は `pollIsAnonymous=true`、`pollDurationHours=24`、`pollOptionImageIndices=[]` が既定値です。

### `MediaAttachment`

```ts
interface MediaAttachment {
  file: Blob | File | Buffer | ArrayBuffer | Uint8Array | string;
  alt?: string;
  spoiler?: boolean;
  r18?: boolean;
}
```

`string` はファイルパスではなくFormDataに渡せる値として扱います。Nodeでファイルを送る場合は `Blob` や `File` を使ってください。

### `PollDraft`

```ts
interface PollDraft {
  options: string[];
  durationHours?: number;
  isAnonymous?: boolean;
  optionImages?: {
    index: number;
    file: Blob | File | Buffer | ArrayBuffer | Uint8Array | string;
  }[];
}
```

投票の選択肢は2個以上です。`durationHours` は正の整数です。

## DM Payload

```ts
const dm = await kt.dm.with("@username");

await dm.send("hello", {
  replyToId: 123,
  attachments: [
    {
      file,
      alt: "説明",
      spoiler: false,
      r18: false,
    },
  ],
  poll: {
    options: ["A", "B"],
    durationHours: 24,
  },
});
```

```ts
interface DmMessageOptions {
  replyToId?: string | number;
  attachments?: MediaAttachment[];
  poll?: PollDraft;
}
```

DM送信は、本文、添付、投票のどれかが必要です。

## ResourceTarget

多くのメソッドは投稿やユーザーを次の形で受け取れます。

```ts
type ResourceTarget =
  | string
  | number
  | {
      id: string | number;
    };
```

例:

```ts
await kt.posts.fetch(631800);
await kt.posts.fetch("631800");
await kt.posts.fetch(post);

await kt.users.get("@karon");
await kt.users.follow(profile.user);
```

usernameは `@` 付きでも渡せます。ユーザーIDを渡す高レベルAPIは、基本的にusername指定もできます。username指定時はSDKが `/users/{username}` でIDへ解決します。

```ts
await kt.follows.follow("@name");
await kt.dm.createGroup(["@alice", "@bob"]);
await kt.social.createCircle({ name: "friends", memberIds: ["@alice"] });
await kt.social.sendQuestion({ targetUserId: "@alice", content: "質問" });
await kt.radio.inviteSpeaker(spaceId, "@alice");
await kt.auth.switchSession({ userId: "@alice" });
await kt.developer.getUser("@alice");
await kt.admin.user("@alice");
await kt.admin.testRecommend({ userId: "@alice" });
```

## メソッド一覧

### `Karotter`

| メソッド | 引数 | 内容 |
|---|---|---|
| `id` | なし | ログイン中ユーザーID |
| `isLoggedIn` | なし | ログイン状態 |
| `login(input)` | `LoginOptions` | ログイン |
| `register(input)` | `RegisterInput` | アカウント登録 |
| `useToken(input)` | `TokenLoginOptions` | tokenを適用 |
| `me()` | なし | 自分のユーザー情報 |
| `logout()` | なし | ログアウト |
| `post(content, options?)` | `string`, `PostOptions` | 投稿 |
| `media(content, media, options?)` | `string`, `MediaAttachment[]`, `PostOptions` | メディア投稿 |
| `poll(content, options)` | `string`, `PollPostOptions` | 投票投稿 |
| `reply(target, content, options?)` | `ResourceTarget`, `string`, `PostOptions` | 返信 |
| `quote(target, content, options?)` | `ResourceTarget`, `string`, `PostOptions` | 引用 |
| `delete(target)` | `ResourceTarget` | 投稿削除 |
| `like(target)` / `unlike(target)` | `ResourceTarget` | いいね操作 |
| `repost(target)` / `unrepost(target)` | `ResourceTarget` | リポスト操作 |
| `bookmark(target)` / `unbookmark(target)` | `ResourceTarget` | ブックマーク操作 |
| `connect()` / `disconnect()` | なし | WebSocket接続操作 |
| `on(event, fn)` / `once(event, fn)` / `off(event, fn)` | event名, handler | realtime event |
| `emit(event, payload)` | event名, payload | client event送信 |
| `request(method, path, input?)` | HTTP method, path, `RequestInput` | 低レベルHTTP |
| `destroy()` | なし | WebSocket切断と後始末 |

### `kt.auth`

| メソッド | 引数 | 内容 |
|---|---|---|
| `csrf()` | なし | CSRF token取得 |
| `invalidateCsrf()` | なし | CSRF token破棄 |
| `refresh()` | なし | access token更新 |
| `sessions()` | なし | セッション一覧 |
| `revokeSession(sessionId)` | `string` | 指定セッション失効 |
| `revokeOtherSessions()` | なし | 他セッション失効 |
| `revokeAllSessions()` | なし | 全セッション失効 |
| `switchSession(input)` | `{ sessionId?: string; userId?: ResourceTarget }` | セッション切替 |
| `unreadSnapshots()` | なし | セッション別未読 |
| `forgotPassword(email)` | `string` | パスワード再設定メール |
| `resetPassword(token, password)` | `string`, `string` | パスワード再設定 |
| `verifyEmail(token)` | `string` | メール認証 |
| `setEmail(email)` | `string` | メール変更 |
| `resendVerificationEmail()` | なし | 認証メール再送 |
| `resendVerificationByEmail(email)` | `string` | メール指定で再送 |
| `oauthUrl(options)` | `{ provider; mode; frontendOrigin?; next?; addAccount? }` | OAuth開始URL |

### `kt.posts`

| メソッド | 引数 | 内容 |
|---|---|---|
| `create(content, options?)` | `string`, `PostOptions` | 投稿 |
| `media(content, media, options?)` | `string`, `MediaAttachment[]`, `PostOptions` | メディア投稿 |
| `poll(content, options)` | `string`, `PollPostOptions` | 投票投稿 |
| `reply(target, content, options?)` | `ResourceTarget`, `string`, `PostOptions` | 返信 |
| `quote(target, content, options?)` | `ResourceTarget`, `string`, `PostOptions` | 引用 |
| `get(target, query?)` | `ResourceTarget`, `FetchOptions` | `{ post }` 形式で取得 |
| `fetch(target, query?)` | `ResourceTarget`, `FetchOptions` | `Post` を取得 |
| `update(target, input)` / `edit(target, input)` | `ResourceTarget`, `CreatePostInput` | 投稿編集 |
| `delete(target)` | `ResourceTarget` | 投稿削除 |
| `replies(target, query?)` | `ResourceTarget`, `Pagination` | 返信一覧 |
| `quotes(target, query?)` | `ResourceTarget`, `Pagination` | 引用一覧 |
| `likes(target, query?)` | `ResourceTarget`, `Pagination` | いいねユーザー |
| `reposts(target, query?)` / `rekarots(target, query?)` | `ResourceTarget`, `Pagination` | リポストユーザー |
| `conversation(target)` | `ResourceTarget` | 会話情報 |
| `replyTargets(target)` | `ResourceTarget` | 返信対象候補 |
| `leaveConversation(target)` | `ResourceTarget` | 会話から退出 |
| `analytics(target)` | `ResourceTarget` | 投稿分析 |
| `like(target)` / `unlike(target)` | `ResourceTarget` | いいね操作 |
| `repost(target)` / `unrepost(target)` | `ResourceTarget` | リポスト操作 |
| `bookmarks(query?)` | `BookmarkListOptions` | 自分のブックマーク一覧 |
| `bookmark(target, folderIds?)` | `ResourceTarget`, `number[]` | ブックマーク |
| `unbookmark(target)` | `ResourceTarget` | ブックマーク解除 |
| `setBookmarkFolders(target, folderIds)` | `ResourceTarget`, `number[]` | ブックマークフォルダ設定 |
| `react(target, emoji)` / `unreact(target, emoji)` | `ResourceTarget`, `string` | 絵文字リアクション |
| `reactionUsers(target, emoji, query?)` | `ResourceTarget`, `string`, `Pagination` | リアクションユーザー |
| `vote(target, optionId)` | `ResourceTarget`, `number` | 投票 |
| `pollVoters(target, optionId, query?)` | `ResourceTarget`, `number`, `Pagination` | 投票者 |
| `reportViews(targets)` | `ResourceTarget[]` | view記録 |
| `betaSurvey(preference, variant?)` | `"beta" | "current"`, `string?` | beta feedback |
| `scheduled()` / `cancelScheduled(target)` | なし / `ResourceTarget` | 予約投稿 |
| `bookmarkFolders()` | なし | ブックマークフォルダ一覧 |
| `createBookmarkFolder(name)` | `string` | フォルダ作成 |
| `updateBookmarkFolder(id, input)` | `number`, `{ name?: string }` | フォルダ更新 |
| `deleteBookmarkFolder(id)` | `number` | フォルダ削除 |
| `drafts()` | なし | 下書き一覧 |
| `createDraft(input)` | `CreatePostInput` | 下書き作成 |
| `updateDraft(id, input)` | `number`, `CreatePostInput` | 下書き更新 |
| `deleteDraft(id)` | `number` | 下書き削除 |

### `kt.timeline`

| メソッド | 引数 | 内容 |
|---|---|---|
| `home(query?)` | `{ page?, limit?, mode? }` | ホーム |
| `latest(query?)` | `{ page?, limit? }` | 最新 |
| `following(query?)` | `{ page?, limit? }` | フォロー中 |
| `trending()` | なし | トレンド |
| `recommended(query?)` | `{ page?, limit?, mode? }` | おすすめ |

### `kt.users`

| メソッド | 引数 | 内容 |
|---|---|---|
| `get(target, query?)` | `ResourceTarget`, `FetchOptions` | ユーザー詳細 |
| `list(target, type, query?)` | `ResourceTarget`, `"followers" | "following" | "likes" | "media" | "replies"`, `Pagination` | 指定種別の一覧 |
| `posts(target, query?)` | `ResourceTarget`, `Pagination` | 投稿一覧 |
| `likes(target, query?)` | `ResourceTarget`, `Pagination` | いいね一覧 |
| `media(target, query?)` | `ResourceTarget`, `Pagination` | メディア投稿 |
| `replies(target, query?)` | `ResourceTarget`, `Pagination` | 返信 |
| `followers(target, query?)` | `ResourceTarget`, `Pagination` | follower |
| `following(target, query?)` | `ResourceTarget`, `Pagination` | following |
| `mutualFollowers(target, query?)` | `ResourceTarget`, `Pagination` | 共通follower |
| `recommended(query?)` | `{ limit?: number }` | おすすめユーザー |
| `usernameQuota()` | なし | username変更枠 |
| `updateProfile(input)` | JSON | profile更新 |
| `updateStatus(input)` | JSON | status更新 |
| `updateSettings(input)` | JSON | settings更新 |
| `updatePassword(input)` | `{ currentPassword; newPassword }` | password更新 |
| `updateUsername(username)` | `string` | username更新 |
| `setPinnedPost(target)` | `ResourceTarget | null` | 固定投稿 |
| `deleteAccount(password)` | `string` | アカウント削除 |
| `uploadAvatar(file)` | `MediaInput` | avatar upload |
| `uploadHeader(file)` | `MediaInput` | header upload |
| `follow(target)` / `unfollow(target)` | `ResourceTarget` | follow操作 |
| `block(target)` / `unblock(target)` | `ResourceTarget` | block操作 |
| `mute(target)` / `unmute(target)` | `ResourceTarget` | mute操作 |

### `kt.follows`

| メソッド | 引数 | 戻り値 | endpoint |
|---|---|---|---|
| `follow(target)` | `ResourceTarget` | `MessageEnvelope` | `POST /follow/{userId}` |
| `unfollow(target)` | `ResourceTarget` | `MessageEnvelope` | `DELETE /follow/{userId}` |
| `removeFollower(target)` | `ResourceTarget` | `MessageEnvelope` | `DELETE /follow/follower/{userId}` |
| `pendingRequests()` | なし | `{ requests }` | `GET /follow/requests/pending` |
| `respondToRequest(requestId, action)` | `number | string`, `"accept" | "reject"` | `MessageEnvelope` | `POST /follow/requests/{requestId}/{action}` |
| `enablePostNotify(target)` | `ResourceTarget` | `MessageEnvelope` | `POST /follow/{userId}/post-notify` |
| `disablePostNotify(target)` | `ResourceTarget` | `MessageEnvelope` | `DELETE /follow/{userId}/post-notify` |
| `blocked()` | なし | `{ users, pagination? }` | `GET /follow/block` |
| `block(target)` / `unblock(target)` | `ResourceTarget` | `MessageEnvelope` | `/follow/block/{userId}` |
| `muted()` | なし | `{ users, pagination? }` | `GET /follow/mute` |
| `mute(target)` / `unmute(target)` | `ResourceTarget` | `MessageEnvelope` | `/follow/mute/{userId}` |
| `hideReposts(target)` / `showReposts(target)` | `ResourceTarget` | `MessageEnvelope` | `/follow/hide-rekarots/{userId}` |
| `hideRekarots(target)` / `showRekarots(target)` | `ResourceTarget` | `MessageEnvelope` | `/follow/hide-rekarots/{userId}` |

`ResourceTarget` は数値ID、数値文字列、`{ id }` を渡せます。usernameを渡したい場合は `kt.users.follow("@name")` のほうを使うと内部でID解決します。

### `kt.dm`

| メソッド | 引数 | 戻り値 | endpoint |
|---|---|---|---|
| `groups(query?)` | `Pagination` | `{ groups, pagination? }` | `GET /dm/groups` |
| `createGroup(targets)` | `ResourceTarget[]` | `DmConversation` | `POST /dm/groups` |
| `with(target)` | `ResourceTarget` | `DmConversation` | `POST /dm/start` |
| `group(group)` | `ResourceTarget` | `DmConversation` | ローカル生成 |
| `activeCalls()` | なし | `{ calls }` | `GET /dm/calls/active` |
| `myCalls()` | なし | `{ calls }` | `GET /dm/me/calls` |
| `mySettings()` | なし | JSON | `GET /dm/me/settings` |
| `streamUrl()` | なし | URL文字列 | `/api/dm/stream` |
| `groupStreamUrl(group)` | `ResourceTarget` | URL文字列 | `/api/dm/groups/{id}/stream` |
| `messagesStreamUrl()` | なし | URL文字列 | `/api/dm/messages/stream` |

`kt.dm.with("@name")` は `/users/{username}` でIDを解決してからDMを開始します。

### `DmConversation`

| メソッド | 引数 | 戻り値 | endpoint |
|---|---|---|---|
| `messages(query?)` | `CursorPagination` | `{ messages, pagination? }` | `GET /dm/groups/{groupId}/messages` |
| `fetch()` | なし | `{ group }` | `GET /dm/groups/{groupId}` |
| `update(body)` | JSON | `{ group }` | `PATCH /dm/groups/{groupId}` |
| `delete()` | なし | `MessageEnvelope` | `DELETE /dm/groups/{groupId}` |
| `send(content, options?)` | `string`, `DmMessageOptions` | `DmMessage` | `POST /dm/groups/{groupId}/messages` |
| `sendMedia(content, attachments, options?)` | `string`, `MediaAttachment[]`, `DmMessageOptions` | `DmMessage` | 同上 |
| `sendPoll(content, poll, options?)` | `string`, `PollDraft`, `DmMessageOptions` | `DmMessage` | 同上 |
| `read()` | なし | `MessageEnvelope` | `POST /dm/groups/{groupId}/read` |
| `leave()` | なし | `MessageEnvelope` | `POST /dm/groups/{groupId}/leave` |
| `clear()` | なし | `MessageEnvelope` | `POST /dm/groups/{groupId}/clear` |
| `addMembers(targets)` | `ResourceTarget[]` | `MessageEnvelope` | `POST /dm/groups/{groupId}/members` |
| `addMember(target)` | `ResourceTarget` | `MessageEnvelope` | `POST /dm/groups/{groupId}/members` |
| `removeMember(target)` | `ResourceTarget` | `MessageEnvelope` | `DELETE /dm/groups/{groupId}/members/{userId}` |
| `respondToRequest(action)` | `"accept" | "reject"` | `MessageEnvelope` | `POST /dm/groups/{groupId}/request/{action}` |
| `acceptRequest()` / `rejectRequest()` | なし | `MessageEnvelope` | 同上 |
| `call()` | なし | `{ call }` | `GET /dm/groups/{groupId}/call` |
| `startCall(body?)` / `joinCall(body?)` / `leaveCall(body?)` | JSON任意 | `{ call }` or `MessageEnvelope` | `/dm/groups/{groupId}/call/*` |
| `info()` | なし | `{ group }` | `GET /dm/groups/{groupId}/info` |
| `settings()` / `updateSettings(body)` | なし / JSON | JSON | `/dm/groups/{groupId}/settings` |
| `startTyping()` / `stopTyping()` | なし | `MessageEnvelope` | `/dm/groups/{groupId}/typing*` |
| `files()` / `media()` | なし | `{ files }` / `{ media }` | `/dm/groups/{groupId}/files`, `/media` |
| `pin(message)` / `pinned()` | `ResourceTarget` / なし | `MessageEnvelope` / `{ messages }` | `/dm/groups/{groupId}/pin`, `/pinned` |
| `editMessage(message, content)` | `ResourceTarget`, `string` | `{ message }` | `PATCH /dm/messages/{messageId}` |
| `deleteMessage(message)` | `ResourceTarget` | `MessageEnvelope` | `DELETE /dm/messages/{messageId}` |
| `react(message, emoji)` | `ResourceTarget`, `string` | `MessageEnvelope` | `POST /dm/messages/{messageId}/reactions` |
| `removeReaction(message, emoji?)` | `ResourceTarget`, `string?` | `MessageEnvelope` | `DELETE /dm/messages/{messageId}/reactions/{emoji?}` |
| `vote(message, optionId)` | `ResourceTarget`, `number` | `MessageEnvelope` | `POST /dm/messages/{messageId}/poll/vote` |
| `pinMessage(message)` / `unpinMessage(message)` | `ResourceTarget` | `MessageEnvelope` | `/dm/messages/{messageId}/pin` |
| `reportMessage(message, body)` | `ResourceTarget`, `{ reason; description? }` | `MessageEnvelope` | `POST /dm/messages/{messageId}/report` |
| `translateMessage(message, targetLanguage)` | `ResourceTarget`, `string` | `{ translation, sourceLanguage? }` | `POST /dm/messages/{messageId}/translate` |

```ts
const dm = await kt.dm.with("@karon");
await dm.send("hello");
await dm.sendMedia("image", [{ file, alt: "説明" }]);
await dm.sendPoll("どれ？", { options: ["A", "B"] });

const group = await kt.dm.createGroup(["@alice", "@bob"]);
await group.addMember("@carol");
await group.addMembers(["@dave", 123]);

await group.startCall({ mode: "voice" });
await group.joinCall({ device: "desktop" });
await group.leaveCall({ reason: "manual" });
```

`DmMessageOptions` は `{ replyToId?, attachments?, poll? }` です。添付は `attachments`、投稿は `media` でフィールド名が違います。

### `kt.search`

| メソッド | 引数 | 戻り値 | endpoint |
|---|---|---|---|
| `all(query)` | `{ q, page?, limit?, cursor? }` | `{ users, posts, hashtags, pagination? }` | `GET /search` |
| `users(query)` | 同上 | `{ users, pagination? }` | `GET /search/users` |
| `posts(query)` | `{ q, type?, page?, limit?, cursor? }` | `{ posts, pagination? }` | `GET /search/posts` |
| `hashtags(query)` | `{ q, page?, limit?, cursor? }` | `{ hashtags, pagination? }` | `GET /search/hashtags` |
| `trendingTopics(limit?)` | `number` | `{ trends }` | `GET /search/trending/topics` |
| `trendingHashtags(limit?)` | `number` | `{ hashtags }` | `GET /search/trending/hashtags` |
| `latest(query?)` | `CursorPagination` | `{ posts }` | `GET /search/discover/latest` |
| `media(query?)` | `CursorPagination` | `{ posts }` | `GET /search/discover/media` |
| `topics(query?)` | `CursorPagination` | `{ posts }` | `GET /search/discover/topics` |

### `kt.notifications`

| メソッド | 引数 | 戻り値 | endpoint |
|---|---|---|---|
| `list(query?)` | `CursorPagination` | `{ notifications, pagination? }` | `GET /notifications` |
| `unreadCount()` | なし | `{ count }` | `GET /notifications/unread/count` |
| `groupedPosts(query?)` | `{ limit?, cursor?, notificationIds? }` | `{ posts, pagination? }` | `GET /notifications/grouped-posts` |
| `readAll(input?)` | `{ types?: string[] }` | `MessageEnvelope` | `PATCH /notifications/read-all` |
| `read(id)` | `number | string` | `MessageEnvelope` | `PATCH /notifications/{id}/read` |
| `delete(id)` | `number | string` | `MessageEnvelope` | `DELETE /notifications/{id}` |
| `deleteAll()` | なし | `MessageEnvelope` | `DELETE /notifications/all` |
| `registerPush(input)` | `{ token; deviceId? }` | `MessageEnvelope` | `POST /notifications/push/register` |
| `unregisterPush(token, deviceId?)` | `string`, `string?` | `MessageEnvelope` | `POST /notifications/push/unregister` |

### `kt.social`

| メソッド | 引数 | 戻り値 | endpoint |
|---|---|---|---|
| `circles()` | なし | `{ circles }` | `GET /social/circles` |
| `createCircle(input)` | `{ name; memberIds? }` | `{ circle }` | `POST /social/circles` |
| `deleteCircle(id)` | `number | string` | `MessageEnvelope` | `DELETE /social/circles/{id}` |
| `addCircleMember(circleId, user)` | `number | string`, `ResourceTarget` | `MessageEnvelope` | `POST /social/circles/{circleId}/members` |
| `removeCircleMember(circleId, user)` | `number | string`, `ResourceTarget` | `MessageEnvelope` | `DELETE /social/circles/{circleId}/members/{userId}` |
| `lists()` | なし | `{ lists }` | `GET /social/lists` |
| `createList(input)` | `{ name; description?; isPublic?; memberIds? }` | `{ list }` | `POST /social/lists` |
| `deleteList(id)` | `number | string` | `MessageEnvelope` | `DELETE /social/lists/{id}` |
| `listPosts(listId, query?)` | `number | string`, `Pagination` | `{ posts, pagination? }` | `GET /social/lists/{listId}/posts` |
| `addListMember(listId, user)` / `removeListMember(listId, user)` | `number | string`, `ResourceTarget` | `MessageEnvelope` | `/social/lists/{listId}/members` |
| `stories(query?)` | `Pagination` | `{ stories, pagination? }` | `GET /social/stories` |
| `createStory(form)` | `FormData` | `{ story }` | `POST /social/stories` |
| `deleteStory(id)` | `number | string` | `MessageEnvelope` | `DELETE /social/stories/{id}` |
| `userStories(user)` | `ResourceTarget` | `{ stories, pagination? }` | `GET /social/stories/user/{userId}` |
| `storyComments(id)` | `number | string` | `{ comments, pagination? }` | `GET /social/stories/{id}/comments` |
| `commentStory(id, content)` / `commentOnStory(id, content)` | `number | string`, `string` | `{ comment }` | `POST /social/stories/{id}/comments` |
| `storyViewers(id)` | `number | string` | `{ viewers }` | `GET /social/stories/{id}/viewers` |
| `likeStory(id)` / `unlikeStory(id)` | `number | string` | `MessageEnvelope` | `/social/stories/{id}/like` |
| `viewStory(id)` / `recordStoryView(id)` | `number | string` | `MessageEnvelope` | `POST /social/stories/{id}/views` |
| `questionInbox()` | なし | `{ questions, pagination? }` | `GET /social/questions/inbox` |
| `answerQuestion(id, content)` | `number | string`, `string` | `{ question }` | `POST /social/questions/{id}` |
| `deleteQuestion(id)` | `number | string` | `MessageEnvelope` | `DELETE /social/questions/{id}` |
| `sendQuestion(input)` / `sendAnonymousQuestion(input)` | `{ targetUserId: ResourceTarget; content }` | `MessageEnvelope` | `POST /social/questions/send` |
| `askQuestion(input)` | `{ targetUserId: ResourceTarget; content }` | `MessageEnvelope` | `POST /social/questions/ask` |
| `postQuestion(input)` | `{ targetUserId: ResourceTarget; content }` | `MessageEnvelope` | `POST /social/questions/post` |
| `linkPreview(url)` | `string` | `LinkPreview` | `GET /social/link-preview` |
| `linkPreviewImage(url)` | `string` | `{ imageUrl }` | `GET /social/link-preview-image` |

story作成はSDK側で専用FormData builderをまだ持っていません。`FormData` にサイト準拠の `media`、`caption`、`visibility` などを入れて渡します。

```ts
await kt.social.createCircle({
  name: "friends",
  memberIds: ["@alice", "@bob"],
});

await kt.social.addCircleMember(circleId, "@carol");

await kt.social.createList({
  name: "watch",
  memberIds: ["@alice", 123],
});
```

### `kt.radio`

| メソッド | 引数 | 戻り値 | endpoint |
|---|---|---|---|
| `create(input)` | `{ title; description?; mode?; speakerPermission? }` | `{ space }` | `POST /radio` |
| `get(id)` | `ResourceTarget` | `{ space }` | `GET /radio/{id}` |
| `active()` / `mine()` / `upcoming()` | なし | `{ spaces, pagination? }` | `/radio/active`, `/radio/me`, `/radio/upcoming` |
| `iceServers()` | なし | `{ iceServers }` | `GET /radio/ice-servers` |
| `messages(id, query?)` | `ResourceTarget`, `Pagination` | `{ messages, pagination? }` | `GET /radio/{id}/messages` |
| `sendMessage(id, content)` | `ResourceTarget`, `string` | `{ message }` | `POST /radio/{id}/messages` |
| `join(id)` / `leave(id)` / `end(id)` | `ResourceTarget` | `MessageEnvelope` | `/radio/{id}/join`, `/leave`, `/end` |
| `requestSpeaker(id)` / `acceptSpeakerInvite(id)` | `ResourceTarget` | `MessageEnvelope` | `/radio/{id}/request-speaker`, `/accept-speaker-invite` |
| `inviteSpeaker(id, participant)` / `cancelSpeakerInvite(id, participant)` | `ResourceTarget`, `ResourceTarget` | `MessageEnvelope` | `/radio/{id}/participants/{participantId}/invite-speaker` |
| `muteParticipant(id, participant, isMuted)` | `ResourceTarget`, `ResourceTarget`, `boolean` | `MessageEnvelope` | `PATCH /radio/{id}/participants/{participantId}/mute` |
| `setParticipantRole(id, participant, role)` | `ResourceTarget`, `ResourceTarget`, `string` | `MessageEnvelope` | `PATCH /radio/{id}/participants/{participantId}/role` |
| `updateSettings(id, settings)` | `ResourceTarget`, JSON | `{ space }` | `PATCH /radio/{id}/settings` |

### `kt.draw`

| メソッド | 引数 | 戻り値 | endpoint |
|---|---|---|---|
| `rooms(query?)` | `Pagination` | `{ rooms }` | `GET /draw/rooms` |
| `myRooms()` | なし | `{ rooms }` | `GET /draw/rooms/me` |
| `createRoom(input)` | JSON | `{ room }` | `POST /draw/rooms` |
| `room(roomId)` | `string` | `{ room }` | `GET /draw/rooms/{roomId}` |
| `deleteRoom(roomId)` | `string` | `MessageEnvelope` | `DELETE /draw/rooms/{roomId}` |
| `joinRoom(roomId, inviteCode?)` | `string`, `string?` | `MessageEnvelope` | `POST /draw/rooms/{roomId}/join` |
| `chat(roomId, content)` | `string`, `string` | `MessageEnvelope` | `POST /draw/rooms/{roomId}/chat` |
| `rotateInvite(roomId)` | `string` | `{ inviteCode }` | `POST /draw/rooms/{roomId}/invite/rotate` |
| `syncLayers(roomId, layers)` | `string`, JSON | `MessageEnvelope` | `PUT /draw/rooms/{roomId}/layers` |

### `kt.news`

| メソッド | 引数 | 戻り値 | endpoint |
|---|---|---|---|
| `list(query?)` | `{ page?, limit?, cursor?, category? }` | `{ articles, pagination? }` | `GET /news` |
| `my()` | なし | `{ articles, pagination? }` | `GET /news/me` |
| `get(slugOrId)` / `fetch(slugOrId)` | `number | string` | `{ article }` | `GET /news/{slugOrId}` |
| `create(formOrInput)` | `FormData | NewsArticleInput` | `{ article }` | `POST /news` |
| `update(slugOrId, formOrInput)` | `number | string`, `FormData | Partial<NewsArticleInput>` | `{ article }` | `PUT /news/{slugOrId}` |
| `delete(slugOrId)` | `number | string` | `MessageEnvelope` | `DELETE /news/{slugOrId}` |
| `submit(slugOrId)` | `number | string` | `{ article }` | `POST /news/{slugOrId}/submit` |
| `like(id)` / `unlike(id)` | `number | string` | `MessageEnvelope` | `/news/{id}/like` |
| `comments(id)` | `number | string` | `{ comments, pagination? }` | `GET /news/{id}/comments` |
| `comment(id, content)` / `addComment(id, content)` | `number | string`, `string` | `{ comment }` | `POST /news/{id}/comments` |
| `editComment(id, commentId, content)` | `number | string`, `number | string`, `string` | `{ comment }` | `PATCH /news/{id}/comments/{commentId}` |
| `deleteComment(id, commentId)` | `number | string`, `number | string` | `MessageEnvelope` | `DELETE /news/{id}/comments/{commentId}` |
| `upload(form)` | `FormData` | `{ url }` | `POST /news/uploads` |
| `adminList(query?)` | `Pagination` | `{ articles, pagination? }` | `GET /news/admin/list` |
| `adminReview(id, decision)` | `number | string`, `{ status; reason? }` | `{ article }` | `PATCH /news/admin/{id}/review` |

### `kt.boards`

| メソッド | 引数 | 戻り値 | endpoint |
|---|---|---|---|
| `list()` | なし | `{ boards, pagination? }` | `GET /boards` |
| `create(input)` | `{ name; slug?; description? }` | `{ board }` | `POST /boards` |
| `delete(slug)` | `string` | `MessageEnvelope` | `DELETE /boards/{slug}` |
| `following()` | なし | `{ boards, pagination? }` | `GET /boards/following` |
| `get(slug)` / `fetch(slug)` | `string` | `{ board, threads?, pagination? }` | `GET /boards/{slug}` |
| `follow(slug)` / `unfollow(slug)` | `string` | `MessageEnvelope` | `/boards/{slug}/follow` |
| `createThread(slug, form)` | `string`, `FormData` | `{ thread }` | `POST /boards/{slug}/threads` |
| `thread(slug, threadId)` / `fetchThread(slug, threadId)` | `string`, `number | string` | `{ thread, replies?, pagination? }` | `GET /boards/{slug}/threads/{threadId}` |
| `deleteThread(slug, threadId)` | `string`, `number | string` | `MessageEnvelope` | `DELETE /boards/{slug}/threads/{threadId}` |
| `followThread(slug, threadId)` / `unfollowThread(slug, threadId)` | `string`, `number | string` | `MessageEnvelope` | `/boards/{slug}/threads/{threadId}/follow` |
| `reply(slug, threadId, form)` / `replyThread(slug, threadId, form)` | `string`, `number | string`, `FormData` | `{ reply }` | `POST /boards/{slug}/threads/{threadId}/replies` |
| `reactThread(slug, threadId, emoji)` | `string`, `number | string`, `string` | `MessageEnvelope` | `POST /boards/{slug}/threads/{threadId}/reactions` |
| `reactReply(slug, replyId, emoji)` | `string`, `number | string`, `string` | `MessageEnvelope` | `POST /boards/{slug}/replies/{replyId}/reactions` |
| `threadReactionUsers(slug, threadId, emoji, query?)` | `string`, `number | string`, `string`, `Pagination` | `{ emoji, count, users, pagination? }` | thread reaction users |
| `replyReactionUsers(slug, replyId, emoji, query?)` | `string`, `number | string`, `string`, `Pagination` | `{ emoji, count, users, pagination? }` | reply reaction users |
| `streamUrl(slug)` | `string` | URL文字列 | `/api/boards/{slug}/stream` |

threadとreply作成は `FormData` を渡します。最低限 `content`、必要なら画像ファイルを追加します。

### `kt.apiKeys`

| メソッド | 引数 | 戻り値 | endpoint |
|---|---|---|---|
| `list()` | なし | `{ apiKeys }` | `GET /apikeys` |
| `create(input)` | `ApiKeyCreateInput` | `{ apiKey }` | `POST /apikeys` |
| `revoke(id)` | `number | string` | `MessageEnvelope` | `DELETE /apikeys/{id}` |
| `regenerate(id)` / `rotate(id)` | `number | string` | `{ apiKey }` | `POST /apikeys/{id}/regenerate` |

`create()` のpayloadは `{ name, canReadPosts?, canCreatePosts?, canReadTimeline?, canReadFollows?, canWriteFollows?, requestsPerMinute? }` です。戻り値の `apiKey.key` は作成時と再生成時だけ返ります。

### `kt.developer`

| メソッド | 引数 | 戻り値 | endpoint |
|---|---|---|---|
| `posts(query?)` | `Pagination` | `{ posts, pagination? }` | `GET /developer/posts` |
| `getPost(id)` / `fetchPost(id)` | `number | string` | `{ post }` | `GET /developer/posts/{id}` |
| `postReplies(id, query?)` / `postQuotes(id, query?)` | `number | string`, `Pagination` | `{ replies }` / `{ quotes }` | `/developer/posts/{id}/replies`, `/quotes` |
| `createPost(input)` | `{ content }` | `{ post }` | `POST /developer/posts` |
| `like(id)` / `unlike(id)` | `number | string` | `MessageEnvelope` | `/developer/posts/{id}/like` |
| `bookmark(id)` / `unbookmark(id)` | `number | string` | `MessageEnvelope` | `/developer/posts/{id}/bookmark` |
| `rekarot(id)` / `unrekarot(id)` | `number | string` | `MessageEnvelope` | `/developer/posts/{id}/rekarot` |
| `repost(id)` / `unrepost(id)` | `number | string` | `MessageEnvelope` | 同上 |
| `timeline(query?)` | `{ limit?, mode? }` | `{ posts, pagination? }` | `GET /developer/timeline` |
| `search(query)` | `{ q, type?, limit?, cursor? }` | `{ type, results, pagination? }` | `GET /developer/search` |
| `getUser(id)` / `fetchUser(id)` | `number | string` | `{ user }` | `GET /developer/users/{id}` |
| `userFollowers(id)` / `userFollowing(id)` | `number | string` | `{ users }` | `/developer/users/{id}/followers`, `/following` |
| `follow(id)` / `unfollow(id)` | `number | string` | follow状態 | `/developer/users/{id}/follow` |
| `bookmarks(query?)` | `Pagination` | `{ posts, pagination? }` | `GET /developer/bookmarks` |
| `me()` | なし | `{ user }` | `GET /developer/me` |
| `apiKeys()` | なし | `{ apiKeys }` | `GET /developer/apikeys` |
| `usage()` | なし | `DeveloperUsage` | `GET /developer/usage` |

`kt.developer.v2` にはTwitter v2互換APIがあります。`me`、`userByUsername`、`userTweets`、`homeTimeline`、`createTweet`、`fetchTweet`、`searchRecent`、`deleteTweet`、`userFollowers`、`userFollowing`、`follow`、`unfollow`、`likingUsers`、`retweetedBy`、`quoteTweets`、`likedTweets`、`bookmarks`、`like`、`unlike`、`retweet`、`unretweet`、`block`、`blocking`、`mute`、`muting`、`lists`、`spaces`、`searchSpaces` を持ちます。

### `kt.legal`

| メソッド | 引数 | 戻り値 | endpoint |
|---|---|---|---|
| `terms()` | なし | `string` | `GET /legal/terms` |
| `privacy()` | なし | `string` | `GET /legal/privacy` |
| `summary()` | なし | `LegalSummary` | `GET /legal/summary` |

### `kt.misc`

| メソッド | 引数 | 戻り値 | endpoint |
|---|---|---|---|
| `contact(input)` | `{ name; email; subject?; body }` | `MessageEnvelope` | `POST /contact` |
| `report(input)` | `{ targetType; targetId; reason; description? }` | `MessageEnvelope` | `POST /reports` |

`targetType` は `"USER"`、`"POST"`、`"DM"` などです。

### `kt.admin`

管理者endpointはprefixが `/control-room-x9k2` です。権限がないtokenでは403になります。

| グループ | メソッド |
|---|---|
| dashboard | `dashboard`, `overview`, `analytics`, `stats`, `index` |
| users | `users`, `user`, `fetchUser`, `searchUsers`, `createUser`, `deleteUser`, `banUser`, `unbanUser`, `verifyUser`, `setUserFlags`, `updateUserAccount`, `setUserOfficialMark`, `setUserEmail`, `setUserPassword`, `setUserRole`, `userSessions`, `userPosts`, `userReports`, `userBans`, `userNotes`, `userHistory`, `warnUser`, `userRestrict`, `userSuspend` |
| posts | `posts`, `post`, `fetchPost`, `searchPosts`, `setPostFlags`, `hidePost`, `deletePost` |
| stories | `stories`, `setStoryFlags`, `deleteStory` |
| reports | `reports`, `pendingReports`, `resolvedReports`, `report`, `fetchReport`, `resolveReport`, `dismissReport`, `escalateReport` |
| news | `news`, `newsList`, `newsComments`, `reviewNews`, `deleteNewsArticle`, `deleteNewsComment` |
| moderation | `moderation`, `moderationAutomod`, `moderationFilters`, `moderationQueue`, `moderationRules`, `moderationWords`, `filteredWords`, `flaggedContent`, `blockedWords` |
| system | `settings`, `setSetting`, `config`, `auditLog`, `logs`, `fetchLog`, `maintenance`, `enableMaintenance`, `cron`, `queue`, `cache`, `clearCache`, `migrations`, `system`, `tasks`, `jobs` |
| catalog | `announcements`, `announcement`, `fetchAnnouncement`, `createAnnouncement`, `badges`, `badge`, `fetchBadge`, `createBadge`, `emoji`, `emojiOne`, `fetchEmoji`, `createEmoji`, `frames`, `frame`, `fetchFrame`, `themes`, `theme`, `fetchTheme`, `stickers`, `sticker`, `fetchSticker` |
| security | `bans`, `ban`, `fetchBan`, `createBan`, `ipBans`, `ipBan`, `fetchIpBan`, `shadowbans`, `sessions`, `permissions`, `roles`, `rateLimits` |
| other | `bots`, `verificationRequests`, `appeals`, `featureFlags`, `apiKeys`, `apikeys`, `webhooks`, `betaExperiment`, `testRecommend`, `testTrending`, `surveyResults`, `actions`, `audit`, `backup`, `triggerBackup`, `database`, `dm`, `draw`, `emails`, `feedback`, `features`, `gacha`, `gachaItems`, `fetchGacha`, `invites`, `media`, `monetization`, `notifications`, `payments`, `premium`, `radio`, `search`, `searchIndex`, `statsDaily`, `statsPosts`, `statsUsers`, `subscriptions`, `trending`, `trendingOverride`, `uploads`, `domains` |

管理者APIの戻り値は未公開フィールドが多いため、多くを `AdminJsonResponse` としています。payload形状が判明しているものはメソッド引数に型を付けています。

## 低レベルリクエスト

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

```ts
interface RequestInput {
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  options?: RequestOptions;
}
```

`request()` は検証用の逃げ道として残しています。通常利用のendpointは `kt.posts.*` などの名前空間APIから呼べます。

## エラー

HTTPエラーや通信エラーは `KarotterError` 派生に正規化されます。

```ts
import {
  BannedError,
  KarotterError,
  RateLimitError,
  ValidationError,
} from "@mikumiku-jp/karotter.js";

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
    console.error(error.status, error.code, error.message);
  } else {
    throw error;
  }
}
```

| クラス | 主な用途 |
|---|---|
| `KarotterError` | SDK共通の基底エラー |
| `AuthError` | 認証失敗 |
| `BadRequestError` | 400 |
| `ForbiddenError` | 403 |
| `NotFoundError` | 404 |
| `ConflictError` | 409 |
| `ValidationError` | SDK入力検証 |
| `RateLimitError` | 429。`retryAfterMs` を持つ |
| `BannedError` | BAN状態。`banReason` を持つ場合あり |
| `TurnstileError` | Turnstile関連 |
| `ServerError` | 5xx |
| `NetworkError` | 通信失敗 |
| `TimeoutError` | timeout |

BAN済みのレスポンスは `BannedError` に変換されます。rate limitは `RateLimitError` になり、サーバが返す待ち時間を `retryAfterMs` で参照できます。

## Realtime

```ts
const kt = await karotter.login(
  { id: "username", password: "password" },
  { connect: true },
);

kt.on("dm:new-message", ({ message }) => {
  console.log(message.content);
});

kt.connect();
kt.disconnect();
```

主なevent定数:

```ts
import {
  DmEvents,
  NotificationEventPayload,
  RadioEvents,
  SocketEvents,
} from "@mikumiku-jp/karotter.js";
```

`SocketEvents`、`DmEvents`、`TypingEvents`、`CallEvents`、`VoiceEvents`、`ScreenShareEvents`、`RadioEvents`、`DrawEvents`、`UserStatusEvents` をexportしています。

## 主要export

| 種別 | 名前 |
|---|---|
| クライアント | `karotter`, `Karotter`, `TURNSTILE_SITEKEY`, `OAUTH_PROVIDERS` |
| Actionクラス | `AuthActions`, `PostsActions`, `TimelineActions`, `UsersActions`, `FollowActions`, `DmActions`, `DmConversation`, `SearchActions`, `NotificationsActions`, `SocialActions`, `RadioActions`, `DrawActions`, `NewsActions`, `BoardsActions`, `ApiKeyActions`, `DeveloperActions`, `LegalActions`, `MiscActions`, `AdminActions` |
| エラー | `KarotterError`, `AuthError`, `BadRequestError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `ValidationError`, `RateLimitError`, `BannedError`, `TurnstileError`, `ServerError`, `NetworkError`, `TimeoutError` |
| 型 | `KarotterOptions`, `LoginOptions`, `TokenLoginOptions`, `PostOptions`, `MediaPostOptions`, `PollPostOptions`, `RegisterInput`, `LoginInput`, `CurrentUser`, `User`, `UserDetail`, `Post`, `CreatePostInput`, `MediaAttachment`, `PollDraft`, `Pagination`, `CursorPagination`, `PageInfo`, `Visibility`, `ReplyRestriction`, `Snowflake` など |

## 公開HTTP仕様との関係

SDKの使い方はこのファイルを見てください。HTTP endpoint単位のリファレンスは [`api-reference.md`](./api-reference.md)、低レベルな解析メモは [`api-spec.md`](./api-spec.md) にあります。
