import type { IsoDate, LiteralUnion } from "../util/types.js";
import type { User } from "./User.js";
import type { Post } from "./Post.js";

export type NotificationType = LiteralUnion<
  | "REPLY"
  | "MENTION"
  | "FOLLOW"
  | "FOLLOW_REQUEST"
  | "LIKE"
  | "REKAROT"
  | "QUOTE"
  | "REACTION"
  | "DM"
>;

export interface Notification {
  id: string;
  type: NotificationType;
  actor?: User;
  actors?: User[];
  post?: Post;
  posts?: Post[];
  createdAt: IsoDate;
  readAt?: IsoDate | null;
  [extra: string]: unknown;
}
