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

usernameは `@` 付きでも渡せます。

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
| `switchSession(input)` | `{ sessionId?: string; userId?: number }` | セッション切替 |
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
| `reposts(target, query?)` | `ResourceTarget`, `Pagination` | リポストユーザー |
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
| `betaSurvey(target, variant)` | `ResourceTarget`, `string` | beta feedback |
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
| `list(query?)` | `Pagination & { q? }` | ユーザー一覧 |
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

### その他の名前空間

| 名前空間 | 主なメソッド |
|---|---|
| `kt.follows` | `follow`, `unfollow`, `removeFollower`, `pendingRequests`, `respondToRequest`, `enablePostNotify`, `disablePostNotify`, `blocked`, `block`, `unblock`, `muted`, `mute`, `unmute`, `hideReposts`, `showReposts` |
| `kt.dm` | `groups`, `createGroup`, `with`, `group`, `activeCalls`, `myCalls`, `mySettings`, `streamUrl`, `groupStreamUrl`, `messagesStreamUrl` |
| `DmConversation` | `messages`, `fetch`, `update`, `delete`, `send`, `read`, `leave`, `clear`, `addMembers`, `addMember`, `removeMember`, `respondToRequest`, `acceptRequest`, `rejectRequest`, `call`, `startCall`, `joinCall`, `leaveCall`, `info`, `settings`, `updateSettings`, `startTyping`, `stopTyping`, `files`, `media`, `pin`, `pinned`, `editMessage`, `deleteMessage`, `react`, `removeReaction`, `vote`, `pinMessage`, `unpinMessage`, `reportMessage`, `translateMessage` |
| `kt.search` | `all`, `users`, `posts`, `hashtags`, `trendingTopics`, `trendingHashtags`, `latest`, `media`, `topics` |
| `kt.notifications` | `list`, `unreadCount`, `groupedPosts`, `readAll`, `read`, `delete`, `deleteAll`, `registerPush`, `unregisterPush` |
| `kt.social` | `circles`, `createCircle`, `deleteCircle`, `addCircleMember`, `removeCircleMember`, `lists`, `createList`, `deleteList`, `listPosts`, `addListMember`, `removeListMember`, `stories`, `createStory`, `deleteStory`, `userStories`, `storyComments`, `commentStory`, `storyViewers`, `likeStory`, `unlikeStory`, `viewStory`, `questionInbox`, `answerQuestion`, `deleteQuestion`, `sendQuestion`, `askQuestion`, `postQuestion`, `linkPreview`, `linkPreviewImage` |
| `kt.radio` | `create`, `get`, `active`, `mine`, `upcoming`, `iceServers`, `messages`, `sendMessage`, `join`, `leave`, `end`, `requestSpeaker`, `acceptSpeakerInvite`, `inviteSpeaker`, `cancelSpeakerInvite`, `muteParticipant`, `setParticipantRole`, `updateSettings` |
| `kt.draw` | `rooms`, `myRooms`, `createRoom`, `room`, `deleteRoom`, `joinRoom`, `chat`, `rotateInvite`, `syncLayers` |
| `kt.news` | `list`, `get`, `comment` |
| `kt.boards` | `list`, `get`, `thread`, `createThread`, `reply`, `deleteThread`, `deleteReply` |
| `kt.apiKeys` | `list`, `create`, `revoke`, `rotate`, `stats` |
| `kt.developer` | `posts`, `getPost`, `createPost`, `deletePost`, `repost`, `unrepost`, `getUser`, `follow`, `unfollow`, `like`, `unlike`, `bookmark`, `unbookmark`, `timeline` |
| `kt.legal` | `summary`, `terms`, `privacy`, `contact`, `commercialTransaction`, `guidelines` |
| `kt.misc` | `health`, `upload`, `feedback`, `report`, `reportIssue`, `config`, `validateInvite` |
| `kt.admin` | 管理者向けAPI。`dashboard`, `stats`, `users`, `user`, `updateUser`, `deleteUser`, `posts`, `post`, `deletePost`, `reports`, `report`, `resolveReport`, `news`, `announcement`, `badge`, `ban`, `emojiOne`, `frame`, `ipBan`, `sticker`, `theme` など |

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

`request()` は未対応endpointや検証用に残しています。通常は `kt.posts.*` などの名前空間APIを使ってください。

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
