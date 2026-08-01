# karotter.js SDK リファレンス

対象: `@mikumiku-jp/karotter.js` 0.2.0 の 2026-08-01 追従実装。

## 入口

```ts
import {
  Karotter,
  karotter,
} from "@mikumiku-jp/karotter.js";
```

### `karotter`

| メソッド | 戻り値 | 用途 |
|---|---|---|
| `create(options?)` | `Karotter` | 未認証クライアントを作成 |
| `login(input, options?)` | `Promise<Karotter>` | ログイン済みクライアントを作成 |
| `register(input, options?)` | `Promise<Karotter>` | 登録済みクライアントを作成 |
| `fromToken(input, options?)` | `Promise<Karotter>` | Token からクライアントを作成 |

2FA が必要なアカウントでは `karotter.login()` ではなく `karotter.create()`、`client.login()`、`client.loginWithTwoFactor()` の順で処理します。

### `Karotter`

| メンバー | 型・戻り値 |
|---|---|
| `user` | `CurrentUser \| null` |
| `id` | `Snowflake \| null` |
| `isLoggedIn` | `boolean` |
| `login(input)` | `Promise<CurrentUser>` |
| `loginWithTwoFactor(input)` | `Promise<CurrentUser>` |
| `register(input)` | `Promise<CurrentUser>` |
| `useToken(input)` | `Promise<CurrentUser>` |
| `me()` | `Promise<CurrentUser>` |
| `logout()` | `Promise<MessageEnvelope>` |
| `connect()` | `void` |
| `disconnect()` | `void` |
| `destroy()` | `Promise<void>` |
| `request(method, path, input?)` | `Promise<T>` |

投稿ショートカット:

```ts
client.post(content, options?);
client.media(content, media, options?);
client.poll(content, poll, options?);
client.reply(target, content, options?);
client.quote(target, content, options?);
client.delete(target);
client.like(target);
client.unlike(target);
client.repost(target);
client.unrepost(target);
client.bookmark(target);
client.unbookmark(target);
```

Realtime ショートカット:

```ts
client.on(event, listener);
client.once(event, listener);
client.off(event, listener?);
client.emit(event, ...args);
```

## 設定

```ts
interface KarotterOptions {
  baseUrl?: string;
  timeoutMs?: number;
  userAgent?: string;
  acceptLanguage?: string;
  requestedWith?: string | null;
  autoCsrfRetry?: boolean;
  autoTokenRefresh?: boolean;
  axiosInstance?: AxiosInstance;
  accessToken?: string | null;
  refreshToken?: string | null;
  deviceId?: string;
  deviceName?: string;
  clientType?: "web" | "ios" | "android";
  gateway?: GatewayOptions;
  botToken?: string;
  connect?: boolean;
}
```

既定 `baseUrl` は `https://api.karotter.com` です。`RestClient` が `/api` を付加します。

## API グループ一覧

| プロパティ | クラス |
|---|---|
| `auth` | `AuthActions` |
| `oauth` | `OAuthActions` |
| `posts` | `PostsActions` |
| `timeline` | `TimelineActions` |
| `users` | `UsersActions` |
| `follows` | `FollowActions` |
| `dm` | `DmActions` |
| `notifications` | `NotificationsActions` |
| `search` | `SearchActions` |
| `social` | `SocialActions` |
| `communities` | `CommunitiesActions` |
| `guilds` | `GuildsActions` |
| `channels` | `ChannelsActions` |
| `bot` | `BotActions` |
| `guildBots` | `GuildBotsActions` |
| `radio` | `RadioActions` |
| `draw` | `DrawActions` |
| `news` | `NewsActions` |
| `boards` | `BoardsActions` |
| `subscriptions` | `SubscriptionsActions` |
| `apiKeys` | `ApiKeyActions` |
| `developer` | `DeveloperActions` |
| `legal` | `LegalActions` |
| `misc` | `MiscActions` |
| `admin` | `AdminActions` |

## AuthActions

| メソッド | 用途 |
|---|---|
| `csrf()` | CSRF Token 取得 |
| `invalidateCsrf()` | CSRF Token 失効 |
| `refresh()` | Access Token 更新 |
| `sessions()` | セッション一覧 |
| `revokeSession(sessionId)` | 指定セッション失効 |
| `revokeOtherSessions()` | 他セッション失効 |
| `revokeAllSessions()` | 全セッション失効 |
| `switchSession(input)` | セッション切替。端末情報を省略した場合は認証ストアから補完 |
| `unreadSnapshots(input?)` | `sessionIds` を指定できるセッション別未読数 |
| `forgotPassword(email)` | 再設定メール送信 |
| `resetPassword(token, password)` | パスワード再設定 |
| `verifyEmail(token)` | メール認証 |
| `setEmail(email)` | メール変更 |
| `resendVerificationEmail()` | 認証メール再送 |
| `resendVerificationByEmail(email)` | メール指定再送 |
| `setupTwoFactor()` | 2FA Secret・QR 情報取得 |
| `enableTwoFactor(code)` | 2FA 有効化、Backup Code 取得 |
| `disableTwoFactor(input)` | 2FA 無効化 |
| `legalQuiz()` | 規約クイズ取得 |
| `gradeLegalQuiz(input)` | 規約クイズ採点 |
| `disconnectOAuth(provider)` | OAuth 接続解除 |
| `oauthUrl(options)` | OAuth 開始 URL 生成 |

## PostsActions

| メソッド群 | メソッド |
|---|---|
| 作成 | `create`, `media`, `poll`, `reply`, `quote`, `answerQuestion` |
| 取得 | `get`, `replies`, `quotes`, `likes`, `reposts`, `conversation`, `replyTargets`, `analytics` |
| 更新 | `update`, `edit`, `delete` |
| 反応 | `like`, `unlike`, `repost`, `unrepost`, `bookmark`, `unbookmark`, `react`, `unreact` |
| 投票 | `vote`, `pollVoters` |
| 翻訳 | `translate` |
| View | `reportViews`, `reportPublicFeedViews` |
| 予約 | `scheduled`, `updateScheduled`, `cancelScheduled` |
| Bookmark Folder | `bookmarkFolders`, `createBookmarkFolder`, `updateBookmarkFolder`, `deleteBookmarkFolder`, `setBookmarkFolders` |
| Draft | `drafts`, `createDraft`, `updateDraft`, `deleteDraft` |
| Feedback | `betaSurvey` |

`PostOptions` は公開範囲、返信制限、メディア、投票、予約投稿、AI・広告・年齢フラグを表します。SDK は空投稿、投票選択肢、必要な Circle ID、予約日時を検証します。文字数上限は契約 plan で変わるため、`getActiveSubscriptionPlan()` と `getSubscriptionPlanCapabilities()` で取得し、最終判定はサーバー response を扱います。

`get()` と `fetch()` の `FetchOptions` は `includeMutedOrBlocked` と `includeUnavailableReference` を受け取ります。

## TimelineActions

| メソッド | Endpoint |
|---|---|
| `home(query?)` | `GET /posts/timeline` |
| `latest(query?)` | `GET /posts/timeline?mode=latest` |
| `following(query?)` | `GET /posts/timeline?mode=following` |
| `trending()` | `GET /posts/trending` |
| `recommended(query?)` | `GET /posts/recommended` |
| `public(query?)` | `GET /v2/feed/public` |

`public()` は `PublicFeedOptions` の `kind`、`mode`、`limit`、`cursor`、`page` を受け取ります。

## UsersActions と FollowActions

Users:

```ts
client.users.get(target, query?);
client.users.posts(target, query?);
client.users.likes(target, query?);
client.users.media(target, query?);
client.users.replies(target, query?);
client.users.followers(target, query?);
client.users.following(target, query?);
client.users.mutualFollowers(target, query?);
client.users.followers(target, { q: "name", limit: 20 });
client.users.recommended(query?);
client.users.levelRanking(query?);
client.users.usernameQuota();
client.users.updateProfile(input);
client.users.updateStatus(input);
client.users.updateSettings(input);
client.users.updatePassword(input);
client.users.updateUsername(username);
client.users.setPinnedPost(target, pinned);
client.users.deleteAccount(password);
client.users.uploadAvatar(file);
client.users.uploadHeader(file);
```

`setPinnedPost(target, true)` は固定、`setPinnedPost(target, false)` は対象だけを固定解除します。複数固定は `User.pinnedPostIds` と `UserDetail.pinnedPosts`、上限は `User.pinnedPostLimit` で扱います。

Follow:

```ts
client.follows.follow(target);
client.follows.unfollow(target);
client.follows.block(target);
client.follows.unblock(target);
client.follows.mute(target);
client.follows.unmute(target);
client.follows.removeFollower(target);
client.follows.hideRekarots(target);
client.follows.showRekarots(target);
client.follows.enablePostNotify(target);
client.follows.disablePostNotify(target);
client.follows.pendingRequests();
client.follows.respondToRequest(target, action);
```

## DmActions

```ts
client.dm.groups(query?);
client.dm.unreadCount();
client.dm.createGroup(targets, { name?, isGroup? });
client.dm.with(target);
client.dm.group(group);
client.dm.activeCalls();
client.dm.myCalls();
```

`createGroup()`、`with()`、`group()` は `DmConversation` を返します。

```ts
conversation.info();
conversation.messages(query?);
conversation.send(content, options?);
conversation.editMessage(message, content);
conversation.deleteMessage(message);
conversation.react(message, emoji);
conversation.removeReaction(message, emoji?);
conversation.read(message?);
conversation.typing();
conversation.stopTyping();
conversation.startCall();
conversation.joinCall();
conversation.leaveCall();
conversation.settings();
conversation.updateSettings(input);
conversation.translateMessage(message, targetLanguage);
```

## NotificationsActions

```ts
client.notifications.list({ page?, limit?, types? });
client.notifications.unreadCount();
client.notifications.groupedPosts(query?);
client.notifications.readAll({ types? });
client.notifications.read(id);
client.notifications.delete(id);
client.notifications.deleteAll();
client.notifications.registerPush({ token, platform?, deviceId? });
client.notifications.unregisterPush(token, deviceId?);
```

`list()` と `readAll()` の `types` は `NotificationType[]` を受け取り、comma 区切りの query に変換します。`readAll()` は JSON body を送信しません。Push 登録の `platform` と `deviceId` は省略時に認証ストアから補完します。

## SearchActions と SocialActions

Search:

```ts
client.search.all(query);
client.search.users(query);
client.search.communities(query);
client.search.posts(query);
client.search.hashtags(query);
client.search.trendingTopics(limit?);
client.search.trendingHashtags(limit?);
client.search.latest(query?);
client.search.media(query?);
client.search.topics(query?);
```

`SearchOptions.compact` はユーザー検索の軽量 response 指定に使います。

Social:

```ts
client.social.circles();
client.social.createCircle(input);
client.social.updateCircle(id, input);
client.social.deleteCircle(id);
client.social.addCircleMember(circleId, user);
client.social.removeCircleMember(circleId, user);
client.social.lists();
client.social.createList(input);
client.social.updateList(id, input);
client.social.deleteList(id);
client.social.listPosts(id, query?);
client.social.stories(query?);
client.social.createStory(form);
client.social.questionInbox();
client.social.answerQuestion(id, content);
client.social.linkPreview(url);
```

`stories()` は `StoryListQuery.filter` を受け取ります。

## CommunitiesActions

`CommunitiesActions` は `CommunitiesApi` の全メソッドを公開します。

| メソッド | 用途 |
|---|---|
| `list`, `fetch`, `create`, `update`, `delete` | Community CRUD |
| `join`, `leave`, `invite` | 参加と招待 |
| `members`, `removeMember`, `updateMemberRole` | メンバー管理 |
| `transferOwnership` | 所有権移譲 |
| `posts`, `hidePost` | 投稿一覧と非表示 |
| `updateRules` | ルール更新 |
| `reports`, `updateReport` | Community 内通報 |
| `homeTimelines` | ホーム表示一覧 |
| `addToHomeTimeline`, `removeFromHomeTimeline` | ホーム表示切替 |
| `reorderHomeTimelines` | ホーム表示順更新 |

`create()` と `update()` は `JsonObject | FormData` を受け取ります。

## GuildsActions

| メソッド群 | メソッド |
|---|---|
| CRUD | `list`, `create`, `update`, `delete` |
| 監査・Ban | `auditLogs`, `bans`, `ban`, `unban` |
| Channel | `channels`, `createChannel`, `reorderChannels` |
| Event | `events`, `createEvent`, `updateEvent`, `deleteEvent` |
| Invite | `invites`, `createInvite`, `deleteInvite`, `acceptInvite` |
| Member | `members`, `updateMember`, `removeMember`, `addMemberRole`, `removeMemberRole`, `transferOwnership` |
| Role | `roles`, `createRole`, `updateRole`, `deleteRole` |
| その他 | `searchMessages`, `voiceStates` |

## ChannelsActions

| メソッド群 | メソッド |
|---|---|
| Channel | `update`, `delete`, `setPermission` |
| Voice | `joinVoice`, `leaveVoice` |
| Stage | `createStage`, `updateStage`, `deleteStage`, `updateMyStageState`, `updateStageParticipant` |
| Forum | `forumPosts`, `createForumPost`, `fetchForumPost`, `replyToForumPost` |
| Message | `messages`, `sendMessage`, `updateMessage`, `deleteMessage`, `reactToMessage` |

Message と Forum の作成 payload は `JsonObject | FormData` です。

投稿、DM、Board、Guild message の reaction は `ReactionCode` を受け取ります。Pro 専用 code は `pro:*` で、`isProReactionCode()` から判定できます。

## GuildBotsActions

```ts
client.guildBots.applications();
client.guildBots.createApplication(input);
client.guildBots.deleteApplication(id);
client.guildBots.regenerateToken(id);
```

## BotActions

`KarotterOptions.botToken` で `Authorization: Bot {token}` を設定します。通常セッションの Bearer Token とは分離され、自動 Token refresh は行いません。

```ts
client.bot.guilds();
client.bot.channels(guildId);
client.bot.sendMessage(channelId, content);
client.bot.upsertCommand(input);
client.bot.setCommandPermissions(commandId, input);
```

## SubscriptionsActions

```ts
client.subscriptions.plans();
client.subscriptions.me();
client.subscriptions.checkout({ productCode: "PRO" });
client.subscriptions.portal();
client.subscriptions.updatePreferences({
  premiumBadgeColor: "BLACK",
  showProfileDecoration: true,
  profileAccentColor: "#ff7a00",
});
client.subscriptions.receivedGifts();
client.subscriptions.gift(id);
client.subscriptions.giftCheckout({
  productCode: "PLUS",
  recipientUsername: "username",
});
client.subscriptions.respondToGift(id, { response: "ACCEPT" });
```

購読権利の fallback は次の helper で取得します。`getActiveSubscriptionPlan()` は `ACTIVE`・`TRIALING` と有効期限を評価し、失効済みを `FREE` として扱います。

```ts
const activePlan = getActiveSubscriptionPlan(client.user);
const capabilities = getSubscriptionPlanCapabilities(activePlan);
const uploadLimitFor = (standardLimitBytes: number) =>
  getSubscriptionUploadLimit(activePlan, standardLimitBytes);
```

現行値は Free が200文字・固定1件、Plus が1,000文字・固定3件・返信 boost、Pro が7,000文字・固定5件・返信 boost強化・200 MiB upload・専用 reaction・Profile/Card 装飾です。Pro upload 上限は投稿・返信、Story、Board、DM 添付で確認済みです。

## OAuthActions

```ts
client.oauth.clients();
client.oauth.createClient(input);
client.oauth.deleteClient(id);
client.oauth.regenerateClientSecret(id);
client.oauth.authorizeUrl(input);
client.oauth.exchangeToken(input);
client.oauth.userInfo(accessToken);
```

OAuth Client Secret は作成時または再生成時のレスポンスで取得します。

## RadioActions と DrawActions

Radio:

```ts
client.radio.create(input);
client.radio.active();
client.radio.get(id);
client.radio.join(id);
client.radio.leave(id);
client.radio.end(id);
client.radio.messages(id, query?);
client.radio.realtimeToken(id);
client.radio.requestSpeaker(id);
client.radio.inviteSpeaker(id, participant);
client.radio.transferHost(id, participant);
client.radio.updateSettings(id, settings);
```

Draw:

```ts
client.draw.rooms(query?);
client.draw.myRooms();
client.draw.createRoom(input);
client.draw.room(roomId);
client.draw.joinRoom(roomId, inviteCode?);
client.draw.chat(roomId, content);
client.draw.rotateInvite(roomId);
client.draw.realtimeToken(roomId);
client.draw.syncLayers(roomId, layers);
client.draw.deleteRoom(roomId);
```

## News、Boards、Developer、Admin

- `news`: 記事、コメント、Like、Review、Upload
- `boards`: Board、Thread、Reply、Reaction、Follow
- `apiKeys`: API Key 作成・削除・再生成
- `legal`: Terms、Privacy、Summary
- `misc`: Contact、Report、Audio Upload
- `admin`: `/control-room-x9k2` 配下の管理 API

### DeveloperActions

`DeveloperActions` は API Key 向けの `/developer` API を網羅し、`v2` から Twitter v2 互換 API を公開します。

| 分類 | メソッド |
|---|---|
| 投稿 | `posts`, `fetchPost`, `postReplies`, `postQuotes`, `createPost`, `updatePost`, `deletePost` |
| 反応 | `like`, `unlike`, `bookmark`, `unbookmark`, `setBookmarkFolders`, `rekarot`, `unrekarot`, `reactions`, `react`, `unreact` |
| Timeline・検索 | `timeline`, `search`, `bookmarks` |
| User・Follow | `me`, `fetchUser`, `userByUsername`, `userFollowers`, `userFollowing`, `follow`, `unfollow`, `followState`, `followRequests`, `acceptFollowRequest`, `rejectFollowRequest` |
| News | `news`, `createNews`, `uploadNewsMedia`, `fetchNews`, `updateNews`, `submitNews` |
| Story | `stories`, `userStories`, `likeStory`, `unlikeStory`, `storyComments`, `commentStory` |
| Board | `boards`, `board`, `boardThread`, `createBoardThread`, `replyToBoardThread`, `reactToBoardThread`, `reactToBoardReply` |
| DM | `dmGroups`, `dmMessages`, `sendDmMessage`, `sendDmImages`, `markDmRead` |
| Notification | `notifications`, `unreadNotificationCount`, `markNotificationRead`, `markAllNotificationsRead`, `deleteNotification` |
| Schema | `postSchema`, `userSchema`, `pollSchema`, `timelineItemSchema` |
| 管理 | `apiKeys`, `usage` |

Twitter v2 互換 API は `client.developer.v2` の `me`, `fetchUser`, `userByUsername`, `userTweets`, `homeTimeline`, `createTweet`, `fetchTweet`, `searchRecent` などを利用します。

管理 API は管理者権限を持つセッションでのみ利用できます。

## エラー

| クラス | 用途 |
|---|---|
| `KarotterError` | 基底エラー |
| `AuthError` | 認証エラー |
| `TwoFactorRequiredError` | 2FA 継続が必要 |
| `BadRequestError` | 400 |
| `ForbiddenError` | 403 |
| `NotFoundError` | 404 |
| `ConflictError` | 409 |
| `ValidationError` | SDK または API の入力検証 |
| `RateLimitError` | 429、`retryAfterMs` を保持 |
| `BannedError` | Ban 情報を保持 |
| `TurnstileError` | Turnstile |
| `ServerError` | 5xx |
| `NetworkError` | 通信失敗 |
| `TimeoutError` | Timeout |

`KarotterError` は `status`、`code`、`data`、`cause` を保持します。

## 主要 export

- 基本: `Karotter`, `karotter`, `KarotterOptions`, `ResourceTarget`
- 認証: `LoginInput`, `LoginResult`, `TwoFactorLoginInput`, `TwoFactorSetup`, `LegalQuiz`
- 投稿: `Post`, `CreatePostInput`, `ScheduledPost`, `PostTranslation`
- Community: `Community`, `CommunityMember`, `CommunityTimeline`
- Guild: `Guild`, `GuildChannel`, `GuildMember`, `GuildRole`, `GuildMessage`, `GuildForumPost`, `GuildApplicationCommand`
- Bot・OAuth: `BotCommandInput`, `GuildCommandPermission`, `OAuthAuthorizeInput`, `OAuthTokenInput`, `OAuthTokenResult`, `OAuthUserInfo`
- Subscription: `SubscriptionOverview`, `SubscriptionEntitlements`, `SubscriptionPlan`, `SubscriptionPreferences`, `SubscriptionGift`
- Developer: `DeveloperPostCreateInput`, `DeveloperPostUpdateInput`, `DeveloperDmImagesInput`, `DeveloperUsage`
- Realtime: `SocketEvents`, `DmEvents`, `GuildEvents`, `ChannelEvents`, `RadioEvents`, `DrawEvents`, `VoiceEvents`
- 共通: `Snowflake`, `Pagination`, `JsonObject`, `MessageEnvelope`

HTTP endpoint、認証、Cookie、Retry、Socket.IO の詳細は [Karotter API リファレンス](./karotter-api/README.md) を参照してください。
