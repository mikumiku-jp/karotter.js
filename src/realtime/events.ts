import type { DmMessage } from "../structures/Dm.js";
import type {
  DrawLayers,
  DrawRoom,
  DrawStroke,
  DrawStrokePoint,
} from "../structures/Draw.js";
import type {
  GuildChannel,
  GuildEvent,
  GuildForumPost,
  GuildMember,
  GuildMessage,
  GuildVoiceState,
} from "../structures/Guild.js";
import type { Post } from "../structures/Post.js";
import type {
  RadioMessage,
  RadioParticipant,
  RadioSpace,
} from "../structures/Radio.js";
import type {
  Snowflake,
  JsonObject,
  UserOnlineStatus,
} from "../util/types.js";
import type { User } from "../structures/User.js";

export const SocketEvents = {
  Connect: "connect",
  Disconnect: "disconnect",
  ConnectError: "connect_error",
  Notification: "notification",
} as const;

export const DmEvents = {
  Join: "dm:join",
  Leave: "dm:leave",
  Read: "dm:read",
  NewMessage: "dm:new-message",
  MessageDeleted: "dm:message-deleted",
  MessageUpdated: "dm:message-updated",
  MemberAdded: "dm:member-added",
  MemberLeft: "dm:member-left",
  MemberRemoved: "dm:member-removed",
  RequestUpdated: "dm:request-updated",
} as const;

export const VoiceEvents = {
  Offer: "voice:offer",
  Answer: "voice:answer",
  IceCandidate: "voice:ice-candidate",
  Hangup: "voice:hangup",
  ParticipantState: "voice:participant-state",
} as const;

export const CallEvents = {
  Incoming: "call:incoming",
  State: "call:state",
} as const;

export const RadioEvents = {
  Join: "radio:join",
  Leave: "radio:leave",
  UserJoined: "radio:user-joined",
  UserLeft: "radio:user-left",
  Ended: "radio:ended",
  Signal: "radio:signal",
  RenegotiateRequest: "radio:renegotiate-request",
  ParticipantState: "radio:participant-state",
  HostDisconnected: "radio:host-disconnected",
  HostReconnected: "radio:host-reconnected",
  Message: "radio:message",
  Reaction: "radio:reaction",
} as const;

export const DrawEvents = {
  Join: "draw:join",
  Leave: "draw:leave",
  RoomState: "draw:room-state",
  LayerSync: "draw:layer-sync",
  Stroke: "draw:stroke",
  Cursor: "draw:cursor",
  Chat: "draw:chat",
  UserLeft: "draw:user-left",
  Error: "draw:error",
} as const;

export const TypingEvents = {
  Start: "typing:start",
  Stop: "typing:stop",
  User: "typing:user",
} as const;

export const ScreenShareEvents = {
  View: "screen-share:view",
} as const;

export const UserStatusEvents = {
  Status: "user:status",
} as const;

export const ChannelEvents = {
  Join: "channel:join",
  Leave: "channel:leave",
  Created: "channel:created",
  Updated: "channel:updated",
  Deleted: "channel:deleted",
} as const;

export const GuildEvents = {
  Join: "guild:join",
  Leave: "guild:leave",
  MessageCreate: "guild:message-create",
  MessageUpdate: "guild:message-update",
  MessageDelete: "guild:message-delete",
  ForumPostCreate: "guild:forum-post-create",
  ForumPostUpdate: "guild:forum-post-update",
  ForumPostDelete: "guild:forum-post-delete",
  TypingStart: "guild:typing:start",
  TypingUser: "guild:typing:user",
  MemberJoined: "guild:member-joined",
  MemberRemoved: "guild:member-removed",
  InvitesUpdated: "guild:invites-updated",
  EventCreated: "guild:event-created",
  EventUpdated: "guild:event-updated",
  EventDeleted: "guild:event-deleted",
  VoiceStateUpdated: "guild:voice-state-updated",
} as const;

export interface NotificationEventPayload {
  type: string;
  actor?: User;
  post?: Post;
  message?: string;
  [extra: string]: unknown;
}

export interface DmGroupEventPayload {
  groupId: Snowflake;
  user?: User;
  member?: User;
  message?: DmMessage;
  [extra: string]: unknown;
}

export interface DmRequestUpdatedPayload {
  groupId: Snowflake;
  status?: string;
  requesterId?: Snowflake;
  targetUserId?: Snowflake;
  [extra: string]: unknown;
}

export interface DmMessagePayload {
  groupId: Snowflake;
  message: DmMessage;
}

export interface DmMessageDeletedPayload {
  groupId: Snowflake;
  messageId: Snowflake;
}

export interface UserStatusPayload {
  userId: Snowflake;
  status: UserOnlineStatus;
  statusMessage?: string | null;
  lastSeenAt?: string | null;
}

export interface CallIncomingPayload {
  groupId: Snowflake;
  callId?: string;
  caller?: User;
  callerId?: Snowflake;
  [extra: string]: unknown;
}

export interface CallStatePayload {
  groupId?: Snowflake;
  callId?: string;
  state: string;
  userId?: Snowflake;
  [extra: string]: unknown;
}

export interface RealtimeSignalPayload {
  targetUserId?: Snowflake;
  fromUserId?: Snowflake;
  roomId?: string | Snowflake;
  spaceId?: Snowflake;
  groupId?: Snowflake;
  sdp?: string;
  candidate?: RTCIceCandidateInit | JsonObject;
  type?: string;
  [extra: string]: unknown;
}

export interface ParticipantStatePayload {
  userId: Snowflake;
  muted?: boolean;
  speaking?: boolean;
  screenSharing?: boolean;
  role?: string;
  [extra: string]: unknown;
}

export interface RadioUserPayload {
  spaceId: Snowflake;
  userId: Snowflake;
  user?: User;
  participant?: RadioParticipant;
  participantsCount?: number;
  [extra: string]: unknown;
}

export interface RadioEndedPayload {
  spaceId: Snowflake;
  endedAt?: string;
  reason?: string;
}

export interface RadioHostPayload {
  spaceId: Snowflake;
  hostId: Snowflake;
}

export interface RadioMessagePayload {
  spaceId: Snowflake;
  message: RadioMessage;
}

export interface RadioReactionPayload {
  spaceId: Snowflake;
  userId?: Snowflake;
  user?: User;
  emoji: string;
  [extra: string]: unknown;
}

export interface DrawRoomStatePayload {
  roomId: string;
  room?: DrawRoom;
  users?: User[];
  layers?: DrawLayers;
  [extra: string]: unknown;
}

export interface DrawStrokePayload {
  roomId: string;
  id?: string;
  layerId?: string;
  userId?: Snowflake;
  username?: string;
  clientId?: string;
  points?: DrawStrokePoint[];
  stroke?: DrawStroke;
  color?: string;
  secondaryColor?: string;
  size?: number;
  opacity?: number;
  drawing?: boolean;
  [extra: string]: unknown;
}

export interface DrawLayerSyncPayload {
  roomId: string;
  layers: DrawLayers;
  fullSync?: boolean;
  revision?: number;
  clientId?: string;
  broadcast?: boolean;
}

export interface DrawCursorPayload {
  roomId: string;
  userId?: Snowflake;
  username?: string;
  clientId?: string;
  x: number;
  y: number;
  drawing?: boolean;
}

export interface DrawChatPayload {
  roomId: string;
  userId: Snowflake;
  content: string;
  user?: User;
  createdAt?: string;
}

export interface DrawErrorPayload {
  message: string;
  code?: string;
  roomId?: string;
}

export interface TypingPayload {
  groupId: Snowflake;
  userId?: Snowflake;
  username?: string;
  displayName?: string;
  user?: User;
}

export interface ScreenShareViewPayload {
  roomId?: string | Snowflake;
  userId?: Snowflake;
  viewing: boolean;
}

export interface GuildMessagePayload {
  channelId: Snowflake;
  message: GuildMessage;
}

export interface GuildMessageDeletedPayload {
  channelId: Snowflake;
  messageId: Snowflake;
}

export interface GuildTypingPayload {
  guildId?: Snowflake;
  channelId: Snowflake;
  userId?: Snowflake;
  username?: string;
}

export interface GuildResourcePayload {
  guildId?: Snowflake;
  channelId?: Snowflake;
  channel?: GuildChannel;
  forumPost?: GuildForumPost;
  member?: GuildMember;
  event?: GuildEvent;
  voiceState?: GuildVoiceState;
  [extra: string]: unknown;
}

export interface ServerToClientEvents {
  notification: (payload: NotificationEventPayload) => void;
  [DmEvents.NewMessage]: (payload: DmMessagePayload) => void;
  [DmEvents.MessageDeleted]: (payload: DmMessageDeletedPayload) => void;
  [DmEvents.MessageUpdated]: (payload: DmMessagePayload) => void;
  [DmEvents.MemberAdded]: (payload: DmGroupEventPayload) => void;
  [DmEvents.MemberLeft]: (payload: DmGroupEventPayload) => void;
  [DmEvents.MemberRemoved]: (payload: DmGroupEventPayload) => void;
  [DmEvents.RequestUpdated]: (payload: DmRequestUpdatedPayload) => void;
  [UserStatusEvents.Status]: (payload: UserStatusPayload) => void;
  [CallEvents.Incoming]: (payload: CallIncomingPayload) => void;
  [CallEvents.State]: (payload: CallStatePayload) => void;
  [VoiceEvents.Offer]: (payload: RealtimeSignalPayload) => void;
  [VoiceEvents.Answer]: (payload: RealtimeSignalPayload) => void;
  [VoiceEvents.IceCandidate]: (payload: RealtimeSignalPayload) => void;
  [VoiceEvents.Hangup]: (payload: { groupId?: Snowflake; userId?: Snowflake }) => void;
  [VoiceEvents.ParticipantState]: (payload: ParticipantStatePayload) => void;
  [RadioEvents.UserJoined]: (payload: RadioUserPayload) => void;
  [RadioEvents.UserLeft]: (payload: RadioUserPayload) => void;
  [RadioEvents.Ended]: (payload: RadioEndedPayload) => void;
  [RadioEvents.Signal]: (payload: RealtimeSignalPayload) => void;
  [RadioEvents.ParticipantState]: (payload: ParticipantStatePayload) => void;
  [RadioEvents.HostDisconnected]: (payload: RadioHostPayload) => void;
  [RadioEvents.HostReconnected]: (payload: RadioHostPayload) => void;
  [RadioEvents.Message]: (payload: RadioMessagePayload) => void;
  [RadioEvents.Reaction]: (payload: RadioReactionPayload) => void;
  [DrawEvents.RoomState]: (payload: DrawRoomStatePayload) => void;
  [DrawEvents.LayerSync]: (payload: DrawLayerSyncPayload) => void;
  [DrawEvents.Stroke]: (payload: DrawStrokePayload) => void;
  [DrawEvents.Cursor]: (payload: DrawCursorPayload) => void;
  [DrawEvents.Chat]: (payload: DrawChatPayload) => void;
  [DrawEvents.UserLeft]: (payload: { roomId: string; userId: Snowflake }) => void;
  [DrawEvents.Error]: (payload: DrawErrorPayload) => void;
  [TypingEvents.User]: (payload: TypingPayload) => void;
  [TypingEvents.Stop]: (payload: TypingPayload) => void;
  [GuildEvents.MessageCreate]: (payload: GuildMessagePayload) => void;
  [GuildEvents.MessageUpdate]: (payload: GuildMessagePayload) => void;
  [GuildEvents.MessageDelete]: (payload: GuildMessageDeletedPayload) => void;
  [GuildEvents.ForumPostCreate]: (payload: GuildResourcePayload) => void;
  [GuildEvents.ForumPostUpdate]: (payload: GuildResourcePayload) => void;
  [GuildEvents.ForumPostDelete]: (payload: GuildResourcePayload) => void;
  [GuildEvents.TypingUser]: (payload: GuildTypingPayload) => void;
  [GuildEvents.MemberJoined]: (payload: GuildResourcePayload) => void;
  [GuildEvents.MemberRemoved]: (payload: GuildResourcePayload) => void;
  [GuildEvents.InvitesUpdated]: (payload: GuildResourcePayload) => void;
  [GuildEvents.EventCreated]: (payload: GuildResourcePayload) => void;
  [GuildEvents.EventUpdated]: (payload: GuildResourcePayload) => void;
  [GuildEvents.EventDeleted]: (payload: GuildResourcePayload) => void;
  [GuildEvents.VoiceStateUpdated]: (payload: GuildResourcePayload) => void;
  [ChannelEvents.Created]: (payload: GuildResourcePayload) => void;
  [ChannelEvents.Updated]: (payload: GuildResourcePayload) => void;
  [ChannelEvents.Deleted]: (payload: GuildResourcePayload) => void;
}

export interface ClientToServerEvents {
  [DmEvents.Join]: (payload: { groupId: Snowflake }) => void;
  [DmEvents.Leave]: (payload: { groupId: Snowflake }) => void;
  [DmEvents.Read]: (payload: { groupId: Snowflake; messageId: Snowflake }) => void;
  [TypingEvents.Start]: (payload: { groupId: Snowflake }) => void;
  [TypingEvents.Stop]: (payload: { groupId: Snowflake }) => void;
  [VoiceEvents.Offer]: (payload: RealtimeSignalPayload) => void;
  [VoiceEvents.Answer]: (payload: RealtimeSignalPayload) => void;
  [VoiceEvents.IceCandidate]: (payload: RealtimeSignalPayload) => void;
  [VoiceEvents.Hangup]: (payload: { groupId?: Snowflake; targetUserId?: Snowflake }) => void;
  [VoiceEvents.ParticipantState]: (payload: ParticipantStatePayload) => void;
  [RadioEvents.Signal]: (payload: RealtimeSignalPayload) => void;
  [RadioEvents.RenegotiateRequest]: (payload: RealtimeSignalPayload) => void;
  [RadioEvents.ParticipantState]: (payload: ParticipantStatePayload) => void;
  [RadioEvents.Message]: (payload: { spaceId: Snowflake; content: string }) => void;
  [RadioEvents.Reaction]: (payload: { spaceId: Snowflake; emoji: string }) => void;
  [DrawEvents.Join]: (payload: { roomId: string; inviteCode?: string }) => void;
  [DrawEvents.Leave]: (payload: { roomId: string }) => void;
  [DrawEvents.LayerSync]: (payload: DrawLayerSyncPayload) => void;
  [DrawEvents.Stroke]: (payload: DrawStrokePayload) => void;
  [DrawEvents.Cursor]: (payload: DrawCursorPayload) => void;
  [DrawEvents.Chat]: (payload: { roomId: string; content: string }) => void;
  [ScreenShareEvents.View]: (payload: ScreenShareViewPayload) => void;
  [GuildEvents.Join]: (payload: { guildId: Snowflake }) => void;
  [GuildEvents.Leave]: (payload: { guildId: Snowflake }) => void;
  [GuildEvents.TypingStart]: (payload: {
    guildId: Snowflake;
    channelId: Snowflake;
  }) => void;
  [ChannelEvents.Join]: (payload: { channelId: Snowflake }) => void;
  [ChannelEvents.Leave]: (payload: { channelId: Snowflake }) => void;
}

export type ServerEventName = keyof ServerToClientEvents;
export type ClientEventName = keyof ClientToServerEvents;
export type ServerEventArgs<T extends ServerEventName> =
  Parameters<ServerToClientEvents[T]>;
export type ClientEventArgs<T extends ClientEventName> =
  Parameters<ClientToServerEvents[T]>;
export type ServerEventHandler<T extends ServerEventName> =
  ServerToClientEvents[T];
