import type { RestClient } from "../RestClient.js";
import type {
  CheckoutSession,
  SubscriptionGift,
  SubscriptionPlan,
  SubscriptionSummary,
} from "../../structures/Subscription.js";
import type { JsonObject, MessageEnvelope, Snowflake } from "../../util/types.js";
import { encodeId } from "../utils.js";

export class SubscriptionsApi {
  constructor(private readonly rest: RestClient) {}

  plans(): Promise<{ plans: SubscriptionPlan[] }> {
    return this.rest.get("/subscriptions/plans");
  }

  me(): Promise<{ summary: SubscriptionSummary }> {
    return this.rest.get("/subscriptions/me");
  }

  checkout(input: JsonObject): Promise<CheckoutSession> {
    return this.rest.post("/subscriptions/checkout", input);
  }

  portal(input: JsonObject = {}): Promise<CheckoutSession> {
    return this.rest.post("/subscriptions/portal", input);
  }

  updatePreferences(input: JsonObject): Promise<MessageEnvelope> {
    return this.rest.patch("/subscriptions/preferences", input);
  }

  receivedGifts(): Promise<{ gifts: SubscriptionGift[] }> {
    return this.rest.get("/subscriptions/gifts/received");
  }

  gift(id: Snowflake | string): Promise<{ gift: SubscriptionGift }> {
    return this.rest.get(`/subscriptions/gifts/${encodeId(id)}`);
  }

  giftCheckout(input: JsonObject): Promise<CheckoutSession> {
    return this.rest.post("/subscriptions/gifts/checkout", input);
  }

  respondToGift(
    id: Snowflake | string,
    input: JsonObject,
  ): Promise<{ gift: SubscriptionGift }> {
    return this.rest.post(
      `/subscriptions/gifts/${encodeId(id)}/response`,
      input,
    );
  }
}
