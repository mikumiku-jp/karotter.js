import type { RestClient } from "../RestClient.js";
import type {
  Community,
  CommunityListResponse,
  CommunityMember,
  CommunityPostsResponse,
  CommunityReport,
  CommunityTimeline,
} from "../../structures/Community.js";
import type {
  JsonObject,
  MessageEnvelope,
  Pagination,
  Snowflake,
} from "../../util/types.js";
import { encodeId, encodeQuery } from "../utils.js";

export type CommunityForm = JsonObject | FormData;

export interface CommunityPostsQuery extends Pagination {
  tab?: string;
}

export class CommunitiesApi {
  constructor(private readonly rest: RestClient) {}

  list(query?: Pagination): Promise<CommunityListResponse> {
    return this.rest.get("/communities", encodeQuery(query));
  }

  create(input: CommunityForm): Promise<{ community: Community }> {
    return this.rest.post("/communities", input);
  }

  fetch(id: Snowflake | string): Promise<{ community: Community }> {
    return this.rest.get(`/communities/${encodeId(id)}`);
  }

  update(
    id: Snowflake | string,
    input: CommunityForm,
  ): Promise<{ community: Community }> {
    return this.rest.patch(`/communities/${encodeId(id)}`, input);
  }

  delete(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/communities/${encodeId(id)}`);
  }

  join(id: Snowflake | string, input: JsonObject = {}): Promise<MessageEnvelope> {
    return this.rest.post(`/communities/${encodeId(id)}/join`, input);
  }

  leave(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/communities/${encodeId(id)}/leave`);
  }

  invite(id: Snowflake | string, input: JsonObject): Promise<MessageEnvelope> {
    return this.rest.post(`/communities/${encodeId(id)}/invite`, input);
  }

  members(
    id: Snowflake | string,
    query?: Pagination,
  ): Promise<{ members: CommunityMember[] }> {
    return this.rest.get(
      `/communities/${encodeId(id)}/members`,
      encodeQuery(query),
    );
  }

  removeMember(
    id: Snowflake | string,
    userId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/communities/${encodeId(id)}/members/${encodeId(userId)}`,
    );
  }

  updateMemberRole(
    id: Snowflake | string,
    userId: Snowflake | string,
    role: string,
  ): Promise<MessageEnvelope> {
    return this.rest.patch(
      `/communities/${encodeId(id)}/members/${encodeId(userId)}/role`,
      { role },
    );
  }

  transferOwnership(
    id: Snowflake | string,
    userId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.post(`/communities/${encodeId(id)}/owner-transfer`, {
      userId,
    });
  }

  posts(
    id: Snowflake | string,
    query?: CommunityPostsQuery,
  ): Promise<CommunityPostsResponse> {
    return this.rest.get(
      `/communities/${encodeId(id)}/posts`,
      encodeQuery(query),
    );
  }

  hidePost(
    id: Snowflake | string,
    postId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.post(
      `/communities/${encodeId(id)}/posts/${encodeId(postId)}/hide`,
    );
  }

  updateRules(
    id: Snowflake | string,
    input: JsonObject,
  ): Promise<MessageEnvelope> {
    return this.rest.put(`/communities/${encodeId(id)}/rules`, input);
  }

  reports(
    id: Snowflake | string,
    query?: Pagination,
  ): Promise<{ reports: CommunityReport[] }> {
    return this.rest.get(
      `/communities/${encodeId(id)}/reports`,
      encodeQuery(query),
    );
  }

  updateReport(
    id: Snowflake | string,
    reportId: Snowflake | string,
    input: JsonObject,
  ): Promise<{ report: CommunityReport }> {
    return this.rest.patch(
      `/communities/${encodeId(id)}/reports/${encodeId(reportId)}`,
      input,
    );
  }

  homeTimelines(): Promise<{ timelines: CommunityTimeline[] }> {
    return this.rest.get("/communities/home-timelines");
  }

  addToHomeTimeline(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/communities/${encodeId(id)}/home-timeline`);
  }

  removeFromHomeTimeline(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/communities/${encodeId(id)}/home-timeline`);
  }

  reorderHomeTimelines(communityIds: Array<Snowflake | string>): Promise<MessageEnvelope> {
    return this.rest.put("/communities/home-timelines/reorder", {
      communityIds,
    });
  }
}
