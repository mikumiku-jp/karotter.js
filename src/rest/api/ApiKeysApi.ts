import type { RestClient } from "../RestClient.js";
import type { ApiKey } from "../../structures/Auth.js";
import type { MessageEnvelope, Snowflake } from "../../util/types.js";
import { encodeId } from "../utils.js";

export interface ApiKeyCreateInput {
  name: string;
  canReadPosts?: boolean;
  canCreatePosts?: boolean;
  canReadTimeline?: boolean;
  canReadFollows?: boolean;
  canWriteFollows?: boolean;
  requestsPerMinute?: number;
}

export class ApiKeysApi {
  constructor(private readonly rest: RestClient) {}

  list(): Promise<{ apiKeys: ApiKey[] }> {
    return this.rest.get("/apikeys");
  }

  create(
    input: ApiKeyCreateInput,
  ): Promise<{ apiKey: ApiKey & { key: string } }> {
    return this.rest.post("/apikeys", input);
  }

  revoke(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/apikeys/${encodeId(id)}`);
  }

  regenerate(id: Snowflake | string): Promise<{ apiKey: ApiKey & { key: string } }> {
    return this.rest.post(`/apikeys/${encodeId(id)}/regenerate`);
  }
}
