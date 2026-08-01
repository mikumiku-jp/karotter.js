import type { IsoDate, Snowflake } from "../util/types.js";
import type { User } from "./User.js";

export interface SubscriptionPlan {
  id: Snowflake | string;
  name: string;
  [extra: string]: unknown;
}

export interface SubscriptionSummary {
  plan?: SubscriptionPlan | null;
  status?: string;
  currentPeriodEnd?: IsoDate | null;
  [extra: string]: unknown;
}

export interface SubscriptionGift {
  id: Snowflake | string;
  sender?: User;
  recipient?: User;
  status?: string;
  [extra: string]: unknown;
}

export interface CheckoutSession {
  url?: string;
  sessionId?: string;
  [extra: string]: unknown;
}
