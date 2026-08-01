import type { RestClient } from "../RestClient.js";
import type {
  AnonymousQuestion,
  Circle,
  LinkPreview,
  SocialList,
  Story,
  StoryComment,
  StoryViewer,
} from "../../structures/Social.js";
import type {
  MessageEnvelope,
  PageInfo,
  Pagination,
  Snowflake,
} from "../../util/types.js";
import { encodeId, encodeQuery } from "../utils.js";
import type { PostListResponse } from "./PostsApi.js";

export interface CirclesResponse {
  circles: Circle[];
}

export interface ListsResponse {
  lists: SocialList[];
}

export interface StoriesResponse {
  stories: Story[];
  pagination?: PageInfo;
}

export interface StoryListQuery extends Pagination {
  filter?: string;
}

export interface StoryCommentsResponse {
  comments: StoryComment[];
  pagination?: PageInfo;
}

export interface QuestionsInboxResponse {
  questions: AnonymousQuestion[];
  pagination?: PageInfo;
}

export class SocialApi {
  constructor(private readonly rest: RestClient) {}

  circles(): Promise<CirclesResponse> {
    return this.rest.get("/social/circles");
  }

  createCircle(input: {
    name: string;
    memberIds?: Snowflake[];
  }): Promise<{ circle: Circle }> {
    return this.rest.post("/social/circles", input);
  }

  deleteCircle(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/social/circles/${encodeId(id)}`);
  }

  updateCircle(
    id: Snowflake | string,
    input: { name?: string },
  ): Promise<{ circle: Circle }> {
    return this.rest.patch(`/social/circles/${encodeId(id)}`, input);
  }

  addCircleMember(
    circleId: Snowflake | string,
    userId: Snowflake,
  ): Promise<MessageEnvelope> {
    return this.rest.post(`/social/circles/${encodeId(circleId)}/members`, {
      userId,
    });
  }

  removeCircleMember(
    circleId: Snowflake | string,
    userId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/social/circles/${encodeId(circleId)}/members/${encodeId(userId)}`,
    );
  }

  lists(): Promise<ListsResponse> {
    return this.rest.get("/social/lists");
  }

  createList(input: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }): Promise<{ list: SocialList }> {
    return this.rest.post("/social/lists", input);
  }

  deleteList(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/social/lists/${encodeId(id)}`);
  }

  updateList(
    id: Snowflake | string,
    input: { name?: string; description?: string; isPublic?: boolean },
  ): Promise<{ list: SocialList }> {
    return this.rest.patch(`/social/lists/${encodeId(id)}`, input);
  }

  listPosts(
    listId: Snowflake | string,
    query?: Pagination,
  ): Promise<PostListResponse> {
    return this.rest.get(
      `/social/lists/${encodeId(listId)}/posts`,
      encodeQuery(query),
    );
  }

  addListMember(
    listId: Snowflake | string,
    userId: Snowflake,
  ): Promise<MessageEnvelope> {
    return this.rest.post(`/social/lists/${encodeId(listId)}/members`, {
      userId,
    });
  }

  removeListMember(
    listId: Snowflake | string,
    userId: Snowflake | string,
  ): Promise<MessageEnvelope> {
    return this.rest.delete(
      `/social/lists/${encodeId(listId)}/members/${encodeId(userId)}`,
    );
  }

  stories(query?: StoryListQuery): Promise<StoriesResponse> {
    return this.rest.get("/social/stories", encodeQuery(query));
  }

  createStory(form: FormData): Promise<{ story: Story }> {
    return this.rest.post("/social/stories", form);
  }

  deleteStory(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/social/stories/${encodeId(id)}`);
  }

  userStories(userId: Snowflake | string): Promise<StoriesResponse> {
    return this.rest.get(`/social/stories/user/${encodeId(userId)}`);
  }

  storyComments(id: Snowflake | string): Promise<StoryCommentsResponse> {
    return this.rest.get(`/social/stories/${encodeId(id)}/comments`);
  }

  commentOnStory(
    id: Snowflake | string,
    content: string,
  ): Promise<{ comment: StoryComment }> {
    return this.rest.post(`/social/stories/${encodeId(id)}/comments`, {
      content,
    });
  }

  storyViewers(id: Snowflake | string): Promise<{ viewers: StoryViewer[] }> {
    return this.rest.get(`/social/stories/${encodeId(id)}/viewers`);
  }

  likeStory(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/social/stories/${encodeId(id)}/like`);
  }

  unlikeStory(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/social/stories/${encodeId(id)}/like`);
  }

  recordStoryView(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.post(`/social/stories/${encodeId(id)}/views`);
  }

  questionInbox(): Promise<QuestionsInboxResponse> {
    return this.rest.get("/social/questions/inbox");
  }

  answerQuestion(
    id: Snowflake | string,
    content: string,
  ): Promise<{ question: AnonymousQuestion }> {
    return this.rest.post(`/social/questions/${encodeId(id)}`, { content });
  }

  deleteQuestion(id: Snowflake | string): Promise<MessageEnvelope> {
    return this.rest.delete(`/social/questions/${encodeId(id)}`);
  }

  sendAnonymousQuestion(input: {
    targetUserId: Snowflake;
    content: string;
  }): Promise<MessageEnvelope> {
    return this.rest.post("/social/questions/send", input);
  }

  askQuestion(input: {
    targetUserId: Snowflake;
    content: string;
  }): Promise<MessageEnvelope> {
    return this.rest.post("/social/questions/ask", input);
  }

  postQuestion(input: {
    targetUserId: Snowflake;
    content: string;
  }): Promise<MessageEnvelope> {
    return this.rest.post("/social/questions/post", input);
  }

  linkPreview(url: string): Promise<LinkPreview> {
    return this.rest.get("/social/link-preview", { params: { url } });
  }

  linkPreviewImage(url: string): Promise<{ imageUrl: string | null }> {
    return this.rest.get("/social/link-preview-image", { params: { url } });
  }
}
