import type { IsoDate, Snowflake } from "../util/types.js";
import type { User } from "./User.js";

export interface DrawRoom {
  id: string;
  name: string;
  ownerId: Snowflake;
  ownerUsername?: string;
  isPrivate: boolean;
  visibility?: string;
  capacity: number;
  inviteCode?: string | null;
  participantCount?: number;
  participantsCount?: number;
  createdAt: IsoDate;
  updatedAt?: IsoDate;
  owner?: User;
  participants?: DrawParticipant[];
  layers?: DrawLayers;
  [extra: string]: unknown;
}

export interface DrawParticipant {
  userId: Snowflake;
  role?: string;
  joinedAt: IsoDate;
  user?: User;
}

export interface DrawLayer {
  id: string;
  name?: string;
  visible?: boolean;
  locked?: boolean;
  opacity?: number;
  dataUrl?: string;
  strokes?: DrawStroke[];
  [extra: string]: unknown;
}

export type DrawLayers = DrawLayer[];

export interface DrawStroke {
  id?: string;
  userId?: Snowflake;
  username?: string;
  clientId?: string;
  layerId?: string;
  color?: string;
  secondaryColor?: string;
  size?: number;
  opacity?: number;
  points: DrawStrokePoint[];
  createdAt?: IsoDate;
  [extra: string]: unknown;
}

export interface DrawStrokePoint {
  x: number;
  y: number;
  pressure?: number;
}
