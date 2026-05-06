import type { RestClient } from "../RestClient.js";

export interface LegalSummary {
  version: string;
  termsEffectiveDate: string;
  privacyEffectiveDate: string;
  [extra: string]: unknown;
}

export class LegalApi {
  constructor(private readonly rest: RestClient) {}

  terms(): Promise<string> {
    return this.rest.get("/legal/terms", { responseType: "text" });
  }

  privacy(): Promise<string> {
    return this.rest.get("/legal/privacy", { responseType: "text" });
  }

  summary(): Promise<LegalSummary> {
    return this.rest.get("/legal/summary");
  }
}
