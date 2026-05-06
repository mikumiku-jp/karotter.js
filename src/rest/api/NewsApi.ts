import type { RestClient } from "../RestClient.js";
import type {
  NewsArticle,
  NewsArticleInput,
  NewsComment,
} from "../../structures/News.js";
import type {
  MessageEnvelope,
  PageInfo,
  Pagination,
  Snowflake,
} from "../../util/types.js";
import { encodeId, encodeQuery } from "../utils.js";

export interface NewsListResponse {
  articles: NewsArticle[];
  pagination?: PageInfo;
}

export interface NewsCommentsResponse {
  comments: NewsComment[];
  pagination?: PageInfo;
}

export interface NewsListQuery extends Pagination {
  category?: string;
}

export class NewsApi {
  constructor(private readonly rest: RestClient) {}

  list(query?: NewsListQuery): Promise<NewsListResponse> {
    return this.rest.get("/news", encodeQuery(query));
  }

  my(): Promise<NewsListResponse> {
    return this.rest.get("/news/me");
  }

  fetch(slugOrId: Snowflake | string): Promise<{ article: NewsArticle }> {
    return this.rest.get(`/news/${encodeId(slugOrId)}`);
  }

  create(form: FormData | NewsArticleInput): Promise<{ article: NewsArticle }> {
    return this.rest.post("/news", form);
  }

  update(
    slugOrId: Snowflake | string,
    form: FormData | Partial<NewsArticleInput>,
  ): Promise<{ article: NewsArticle }> {
    return this.rest.put(`/news/${encodeId(slugOrId)}`, form);
  }

  delete(slugOrId: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/news/${encodeId(slugOrId)}`);
  }

  submit(slugOrId: Snowflake | string): Promise<{ article: NewsArticle }> {
    return this.rest.post(`/news/${encodeId(slugOrId)}/submit`);
  }

  like(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/news/${encodeId(id)}/like`);
  }

  unlike(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/news/${encodeId(id)}/like`);
  }

  comments(id: Snowflake | string): Promise<NewsCommentsResponse> {
    return this.rest.get(`/news/${encodeId(id)}/comments`);
  }

  addComment(
    id: Snowflake | string,
    content: string,
  ): Promise<{ comment: NewsComment }> {
    return this.rest.post(`/news/${encodeId(id)}/comments`, { content });
  }

  editComment(
    id: Snowflake | string,
    commentId: Snowflake | string,
    content: string,
  ): Promise<{ comment: NewsComment }> {
    return this.rest.patch(
      `/news/${encodeId(id)}/comments/${encodeId(commentId)}`,
      { content },
    );
  }

  deleteComment(
    id: Snowflake | string,
    commentId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/news/${encodeId(id)}/comments/${encodeId(commentId)}`,
    );
  }

  upload(form: FormData): Promise<{ url: string }> {
    return this.rest.post("/news/uploads", form);
  }

  adminList(query?: Pagination): Promise<NewsListResponse> {
    return this.rest.get("/news/admin/list", encodeQuery(query));
  }

  adminReview(
    id: Snowflake | string,
    decision: { status: string; reason?: string },
  ): Promise<{ article: NewsArticle }> {
    return this.rest.patch(`/news/admin/${encodeId(id)}/review`, decision);
  }
}
