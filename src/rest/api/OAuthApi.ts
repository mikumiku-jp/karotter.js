import type { RestClient } from "../RestClient.js";
import type { JsonObject, MessageEnvelope, Snowflake } from "../../util/types.js";
import { encodeId } from "../utils.js";

export interface OAuthClient {
  id: Snowflake | string;
  name: string;
  redirectUris?: string[];
  [extra: string]: unknown;
}

export interface OAuthAuthorizeInput {
  clientId: string;
  redirectUri: string;
  scope?: string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: "S256" | "plain";
}

export interface OAuthTokenInput {
  grant_type: "authorization_code" | "refresh_token";
  code?: string;
  redirect_uri?: string;
  client_id?: string;
  client_secret?: string;
  code_verifier?: string;
  refresh_token?: string;
}

export interface OAuthTokenResult {
  access_token: string;
  token_type: "Bearer" | (string & {});
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

export interface OAuthUserInfo {
  sub: string;
  id: Snowflake;
  username: string;
  displayName: string;
  picture?: string | null;
  email?: string;
  email_verified?: boolean;
}

export class OAuthApi {
  constructor(private readonly rest: RestClient) {}

  clients(): Promise<{ clients: OAuthClient[] }> {
    return this.rest.get("/oauth/clients");
  }

  createClient(
    input: JsonObject,
  ): Promise<{ client: OAuthClient; secret?: string }> {
    return this.rest.post("/oauth/clients", input);
  }

  deleteClient(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/oauth/clients/${encodeId(id)}`);
  }

  regenerateClientSecret(id: Snowflake | string): Promise<{ secret: string }> {
    return this.rest.post(`/oauth/clients/${encodeId(id)}/secret`);
  }

  authorizeUrl(input: OAuthAuthorizeInput): string {
    const url = new URL(`${this.rest.baseUrl}/api/oauth/authorize`);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", input.clientId);
    url.searchParams.set("redirect_uri", input.redirectUri);
    if (input.scope) url.searchParams.set("scope", input.scope);
    if (input.state) url.searchParams.set("state", input.state);
    if (input.codeChallenge) {
      url.searchParams.set("code_challenge", input.codeChallenge);
    }
    if (input.codeChallengeMethod) {
      url.searchParams.set(
        "code_challenge_method",
        input.codeChallengeMethod,
      );
    }
    return url.toString();
  }

  exchangeToken(input: OAuthTokenInput): Promise<OAuthTokenResult> {
    return this.rest.post("/oauth/token", input, {
      authorization: null,
      bypassAuthRetry: true,
    });
  }

  userInfo(accessToken: string): Promise<OAuthUserInfo> {
    return this.rest.get("/oauth/userinfo", {
      authorization: `Bearer ${accessToken}`,
      bypassAuthRetry: true,
    });
  }
}
