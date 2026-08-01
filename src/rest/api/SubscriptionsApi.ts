import type { RestClient } from "../RestClient.js";
import type {
  CheckoutSession,
  SubscriptionCheckoutInput,
  SubscriptionGift,
  SubscriptionGiftCheckoutInput,
  SubscriptionGiftResponse,
  SubscriptionGiftResponseInput,
  SubscriptionOverview,
  SubscriptionPlan,
  SubscriptionPreferences,
} from "../../structures/Subscription.js";
import type { MessageEnvelope, Snowflake } from "../../util/types.js";
import { encodeId } from "../utils.js";

export class SubscriptionsApi {
  constructor(private readonly rest: RestClient) {}

  plans(): Promise<{
    plans: SubscriptionPlan[];
    badges?: SubscriptionPlan[];
  }> {
    return this.rest.get("/subscriptions/plans");
  }

  me(): Promise<SubscriptionOverview> {
    return this.rest.get("/subscriptions/me");
  }

  checkout(input: SubscriptionCheckoutInput): Promise<CheckoutSession> {
    return this.rest.post("/subscriptions/checkout", input);
  }

  portal(): Promise<CheckoutSession> {
    return this.rest.post("/subscriptions/portal");
  }

  updatePreferences(
    input: SubscriptionPreferences,
  ): Promise<MessageEnvelope> {
    return this.rest.patch("/subscriptions/preferences", input);
  }

  receivedGifts(): Promise<{ gifts: SubscriptionGift[] }> {
    return this.rest.get("/subscriptions/gifts/received");
  }

  gift(id: Snowflake | string): Promise<{ gift: SubscriptionGift }> {
    return this.rest.get(`/subscriptions/gifts/${encodeId(id)}`);
  }

  giftCheckout(input: SubscriptionGiftCheckoutInput): Promise<CheckoutSession> {
    return this.rest.post("/subscriptions/gifts/checkout", input);
  }

  respondToGift(
    id: Snowflake | string,
    input: SubscriptionGiftResponseInput,
  ): Promise<SubscriptionGiftResponse> {
    return this.rest.post(
      `/subscriptions/gifts/${encodeId(id)}/response`,
      input,
    );
  }
}
