import type { RestClient } from "../RestClient.js";
import type { MessageEnvelope, Snowflake } from "../../util/types.js";
import { appendMedia, type MediaInput } from "../../util/form.js";

export interface ContactInput {
  name: string;
  email: string;
  subject?: string;
  body: string;
}

export interface ReportInput {
  targetType: "USER" | "POST" | "DM" | (string & {});
  targetId: Snowflake | string;
  reason: string;
  description?: string;
}

export class MiscApi {
  constructor(private readonly rest: RestClient) {}

  contact(input: ContactInput): Promise<MessageEnvelope> {
    return this.rest.post("/contact", input);
  }

  report(input: ReportInput): Promise<MessageEnvelope> {
    return this.rest.post("/reports", input);
  }

  uploadAudio(file: MediaInput): Promise<{ url?: string; mediaUrl?: string }> {
    const form = new FormData();
    appendMedia(form, "audio", file);
    return this.rest.post("/audio", form);
  }

}
