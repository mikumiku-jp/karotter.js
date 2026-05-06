import type { RestClient } from "../RestClient.js";
import type {
  Board,
  BoardReply,
  BoardThread,
} from "../../structures/Board.js";
import type {
  MessageEnvelope,
  PageInfo,
  Pagination,
  Snowflake,
} from "../../util/types.js";
import type { User } from "../../structures/User.js";
import { encodeId, encodeQuery } from "../utils.js";

export interface BoardsResponse {
  boards: Board[];
  pagination?: PageInfo;
}

export interface BoardResponse {
  board: Board;
  threads?: BoardThread[];
  pagination?: PageInfo;
}

export interface BoardThreadResponse {
  thread: BoardThread;
  replies?: BoardReply[];
  pagination?: PageInfo;
}

export interface ReactionUsersResponse {
  emoji: string;
  count: number;
  users: User[];
  pagination?: PageInfo;
}

export class BoardsApi {
  constructor(private readonly rest: RestClient) {}

  list(): Promise<BoardsResponse> {
    return this.rest.get("/boards");
  }

  create(input: {
    name: string;
    slug?: string;
    description?: string;
  }): Promise<{ board: Board }> {
    return this.rest.post("/boards", input);
  }

  delete(slug: string): Promise<MessageEnvelope> {
    return this.rest.delete(`/boards/${encodeId(slug)}`);
  }

  following(): Promise<BoardsResponse> {
    return this.rest.get("/boards/following");
  }

  fetch(slug: string): Promise<BoardResponse> {
    return this.rest.get(`/boards/${encodeId(slug)}`);
  }

  follow(slug: string): Promise<MessageEnvelope> {
    return this.rest.post(`/boards/${encodeId(slug)}/follow`);
  }

  unfollow(slug: string): Promise<MessageEnvelope> {
    return this.rest.delete(`/boards/${encodeId(slug)}/follow`);
  }

  createThread(slug: string, form: FormData): Promise<{ thread: BoardThread }> {
    return this.rest.post(`/boards/${encodeId(slug)}/threads`, form);
  }

  fetchThread(
    slug: string,
    threadId: Snowflake | string,
  ): Promise<BoardThreadResponse> {
    return this.rest.get(
      `/boards/${encodeId(slug)}/threads/${encodeId(threadId)}`,
    );
  }

  deleteThread(
    slug: string,
    threadId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/boards/${encodeId(slug)}/threads/${encodeId(threadId)}`,
    );
  }

  followThread(
    slug: string,
    threadId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.post(
      `/boards/${encodeId(slug)}/threads/${encodeId(threadId)}/follow`,
    );
  }

  unfollowThread(
    slug: string,
    threadId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/boards/${encodeId(slug)}/threads/${encodeId(threadId)}/follow`,
    );
  }

  replyThread(
    slug: string,
    threadId: Snowflake | string,
    form: FormData,
  ): Promise<{ reply: BoardReply }> {
    return this.rest.post(
      `/boards/${encodeId(slug)}/threads/${encodeId(threadId)}/replies`,
      form,
    );
  }

  reactThread(
    slug: string,
    threadId: Snowflake | string,
    emoji: string,
  ): Promise<MessageEnvelope> {
    return this.rest.post(
      `/boards/${encodeId(slug)}/threads/${encodeId(threadId)}/reactions`,
      { emoji },
    );
  }

  reactReply(
    slug: string,
    replyId: Snowflake | string,
    emoji: string,
  ): Promise<MessageEnvelope> {
    return this.rest.post(
      `/boards/${encodeId(slug)}/replies/${encodeId(replyId)}/reactions`,
      { emoji },
    );
  }

  threadReactionUsers(
    slug: string,
    threadId: Snowflake | string,
    emoji: string,
    query?: Pagination,
  ): Promise<ReactionUsersResponse> {
    return this.rest.get(
      `/boards/${encodeId(slug)}/threads/${encodeId(threadId)}/reactions/${encodeId(emoji)}/users`,
      encodeQuery(query),
    );
  }

  replyReactionUsers(
    slug: string,
    replyId: Snowflake | string,
    emoji: string,
    query?: Pagination,
  ): Promise<ReactionUsersResponse> {
    return this.rest.get(
      `/boards/${encodeId(slug)}/replies/${encodeId(replyId)}/reactions/${encodeId(emoji)}/users`,
      encodeQuery(query),
    );
  }

  streamUrl(slug: string): string {
    return `${this.rest.baseUrl}/api/boards/${encodeId(slug)}/stream`;
  }
}
