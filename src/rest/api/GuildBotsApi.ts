import type { RestClient } from "../RestClient.js";
import type { GuildBotApplication } from "../../structures/Guild.js";
import type { JsonObject, MessageEnvelope, Snowflake } from "../../util/types.js";
import { encodeId } from "../utils.js";

export class GuildBotsApi {
  constructor(private readonly rest: RestClient) {}

  applications(): Promise<{ applications: GuildBotApplication[] }> {
    return this.rest.get("/guild-bots/applications");
  }

  createApplication(
    input: JsonObject,
  ): Promise<{ application: GuildBotApplication; token?: string }> {
    return this.rest.post("/guild-bots/applications", input);
  }

  deleteApplication(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/guild-bots/applications/${encodeId(id)}`);
  }

  regenerateToken(id: Snowflake | string): Promise<{ token: string }> {
    return this.rest.post(`/guild-bots/applications/${encodeId(id)}/token`);
  }
}
