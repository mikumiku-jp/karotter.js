import type { IsoDate, Snowflake } from "../util/types.js";
import type { User } from "./User.js";

export type KnownSubscriptionPlanCode = "FREE" | "PLUS" | "PRO";

export type SubscriptionPlanCode =
  | "FREE"
  | "PLUS"
  | "PRO"
  | (string & {});

export type SubscriptionProductCode =
  | Exclude<SubscriptionPlanCode, "FREE">
  | "BADGE_RED"
  | "BADGE_GREEN"
  | (string & {});

export type SubscriptionStatus =
  | "ACTIVE"
  | "TRIALING"
  | "INCOMPLETE"
  | "PAST_DUE"
  | "UNPAID"
  | "INACTIVE"
  | "CANCELED"
  | (string & {});

export type SubscriptionGiftStatus =
  | "AWAITING_ACCEPTANCE"
  | "ACCEPTED"
  | "REFUND_PENDING"
  | "DECLINED"
  | "REFUNDED"
  | (string & {});

export type PremiumBadgeColor =
  | "ORANGE"
  | "BLACK"
  | "RED"
  | "GREEN"
  | "PINK"
  | (string & {});

export interface SubscriptionPlan {
  id?: Snowflake | string;
  code: SubscriptionProductCode;
  name: string;
  type?: "plan" | "badge" | (string & {});
  amount: number;
  currency: string;
  interval: "month" | (string & {});
  [extra: string]: unknown;
}

export interface SubscriptionSummary {
  plan: SubscriptionPlanCode;
  status: SubscriptionStatus;
  activeUntil?: IsoDate | null;
  currentPeriodEnd?: IsoDate | null;
  cancelAtPeriodEnd?: boolean;
  scheduledPlan?: SubscriptionPlanCode | null;
  scheduledPlanEffectiveAt?: IsoDate | null;
  badgeColors?: PremiumBadgeColor[];
  showSubscriptionBadges?: boolean;
  showPlusBadge?: boolean;
  showProBadge?: boolean;
  showRedBadge?: boolean;
  showGreenBadge?: boolean;
  showProfileDecoration?: boolean;
  showCardDecoration?: boolean;
  premiumBadgeColor?: PremiumBadgeColor;
  profileAccentColor?: string | null;
  cardAccentColor?: string | null;
  [extra: string]: unknown;
}

export interface SubscriptionEntitlements {
  postTextLimit: number;
  pinnedPostLimit: number;
  uploadLimitBytes: number | null;
  canCustomizeProfile: boolean;
  canCustomizeCards: boolean;
  replyRankingBoost?: "NONE" | "PLUS" | "PRO";
  canUseProReactions?: boolean;
  [extra: string]: unknown;
}

export interface SubscriptionPlanCapabilities
  extends SubscriptionEntitlements {
  replyRankingBoost: "NONE" | "PLUS" | "PRO";
  canUseProReactions: boolean;
}

export interface SubscriptionState {
  subscriptionPlan?: SubscriptionPlanCode | null;
  subscriptionStatus?: SubscriptionStatus | null;
  subscriptionActiveUntil?: IsoDate | Date | null;
}

export const SUBSCRIPTION_PLAN_CAPABILITIES: Readonly<
  Record<KnownSubscriptionPlanCode, Readonly<SubscriptionPlanCapabilities>>
> = {
  FREE: {
    postTextLimit: 200,
    pinnedPostLimit: 1,
    uploadLimitBytes: null,
    canCustomizeProfile: false,
    canCustomizeCards: false,
    replyRankingBoost: "NONE",
    canUseProReactions: false,
  },
  PLUS: {
    postTextLimit: 1_000,
    pinnedPostLimit: 3,
    uploadLimitBytes: null,
    canCustomizeProfile: false,
    canCustomizeCards: false,
    replyRankingBoost: "PLUS",
    canUseProReactions: false,
  },
  PRO: {
    postTextLimit: 7_000,
    pinnedPostLimit: 5,
    uploadLimitBytes: 209_715_200,
    canCustomizeProfile: true,
    canCustomizeCards: true,
    replyRankingBoost: "PRO",
    canUseProReactions: true,
  },
};

export function getActiveSubscriptionPlan(
  subscription: SubscriptionState | null | undefined,
  now = Date.now(),
): KnownSubscriptionPlanCode {
  const plan = normalizeSubscriptionPlan(subscription?.subscriptionPlan);
  if (plan === "FREE") return "FREE";
  if (
    subscription?.subscriptionStatus !== "ACTIVE" &&
    subscription?.subscriptionStatus !== "TRIALING"
  ) {
    return "FREE";
  }
  if (!subscription.subscriptionActiveUntil) return plan;
  const activeUntil =
    subscription.subscriptionActiveUntil instanceof Date
      ? subscription.subscriptionActiveUntil.getTime()
      : Date.parse(subscription.subscriptionActiveUntil);
  return Number.isNaN(activeUntil) || activeUntil <= now ? "FREE" : plan;
}

export function getSubscriptionPlanCapabilities(
  plan: SubscriptionPlanCode | null | undefined,
): Readonly<SubscriptionPlanCapabilities> {
  return SUBSCRIPTION_PLAN_CAPABILITIES[normalizeSubscriptionPlan(plan)];
}

export function getSubscriptionUploadLimit(
  plan: SubscriptionPlanCode | null | undefined,
  standardLimitBytes: number,
): number {
  return (
    getSubscriptionPlanCapabilities(plan).uploadLimitBytes ?? standardLimitBytes
  );
}

function normalizeSubscriptionPlan(
  plan: SubscriptionPlanCode | null | undefined,
): KnownSubscriptionPlanCode {
  if (plan === "PRO") return "PRO";
  if (plan === "PLUS") return "PLUS";
  return "FREE";
}

export interface SubscriptionRecord {
  id: Snowflake | string;
  productCode: SubscriptionProductCode;
  status: SubscriptionStatus;
  isEnabled?: boolean;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: IsoDate | null;
  [extra: string]: unknown;
}

export interface SubscriptionOverview {
  summary: SubscriptionSummary;
  entitlements?: SubscriptionEntitlements;
  plans?: SubscriptionPlan[];
  badges?: SubscriptionPlan[];
  subscriptions?: SubscriptionRecord[];
  [extra: string]: unknown;
}

export interface SubscriptionPreferences {
  premiumBadgeColor?: PremiumBadgeColor;
  showSubscriptionBadges?: boolean;
  showPlusBadge?: boolean;
  showProBadge?: boolean;
  showRedBadge?: boolean;
  showGreenBadge?: boolean;
  showProfileDecoration?: boolean;
  showCardDecoration?: boolean;
  profileAccentColor?: string | null;
  cardAccentColor?: string | null;
}

export interface SubscriptionCheckoutInput {
  productCode: SubscriptionProductCode;
}

export interface SubscriptionGiftCheckoutInput
  extends SubscriptionCheckoutInput {
  recipientUsername: string;
}

export type SubscriptionGiftResponseAction = "ACCEPT" | "DECLINE";

export interface SubscriptionGiftResponseInput {
  response: SubscriptionGiftResponseAction;
}

export interface SubscriptionGift {
  id: Snowflake | string;
  purchaser: User;
  recipient?: User;
  productCode: SubscriptionProductCode;
  status?: SubscriptionGiftStatus;
  paidAt?: IsoDate | null;
  [extra: string]: unknown;
}

export interface SubscriptionGiftResponse {
  accepted?: boolean;
  refunded?: boolean;
  noPaymentRequired?: boolean;
  gift?: SubscriptionGift;
  [extra: string]: unknown;
}

export interface CheckoutSession {
  url?: string;
  sessionId?: string;
  upgraded?: boolean;
  downgradeScheduled?: boolean;
  [extra: string]: unknown;
}
