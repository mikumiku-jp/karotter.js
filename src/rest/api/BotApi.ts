import type {
  Guild,
  GuildApplicationCommand,
  GuildChannel,
  GuildCommandPermission,
  GuildMessage,
} from "../../structures/Guild.js";
import type { JsonObject, Snowflake } from "../../util/types.js";
import { ValidationError } from "../../util/errors.js";
import type { RestClient } from "../RestClient.js";
import { encodeId } from "../utils.js";

export interface BotCommandInput {
  name: string;
  description: string;
  guildId?: Snowflake;
  defaultMemberPermissions?: string;
  payload?: JsonObject;
}

export interface BotCommandPermissionsInput {
  guildId: Snowflake;
  permissions: GuildCommandPermission[];
}

export class BotApi {
  constructor(
    private readonly rest: RestClient,
    private readonly token?: string,
  ) {}

  guilds(): Promise<{ guilds: Guild[] }> {
    return this.rest.get("/developer/guilds", this.requestOptions());
  }

  channels(guildId: Snowflake | string): Promise<{ channels: GuildChannel[] }> {
    return this.rest.get(
      `/developer/guilds/${encodeId(guildId)}/channels`,
      this.requestOptions(),
    );
  }

  sendMessage(
    channelId: Snowflake | string,
    content: string,
  ): Promise<{ message: GuildMessage }> {
    return this.rest.post(
      `/developer/channels/${encodeId(channelId)}/messages`,
      { content },
      this.requestOptions(),
    );
  }

  upsertCommand(
    input: BotCommandInput,
  ): Promise<{ command: GuildApplicationCommand }> {
    return this.rest.post(
      "/developer/applications/commands",
      input,
      this.requestOptions(),
    );
  }

  setCommandPermissions(
    commandId: Snowflake | string,
    input: BotCommandPermissionsInput,
  ): Promise<{ command: GuildApplicationCommand }> {
    return this.rest.put(
      `/developer/applications/commands/${encodeId(commandId)}/permissions`,
      input,
      this.requestOptions(),
    );
  }

  private requestOptions() {
    if (!this.token) {
      throw new ValidationError("Bot token is required");
    }
    return {
      authorization: `Bot ${this.token}`,
      bypassAuthRetry: true,
    };
  }
}
