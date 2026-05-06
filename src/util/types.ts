export type Snowflake = number;
export type IsoDate = string;
export type LiteralUnion<T extends string> = T | (string & {});
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue | undefined };
export type JsonArray = JsonValue[];
export type QueryParamPrimitive = string | number | boolean | null | undefined;
export type QueryParamValue = QueryParamPrimitive | QueryParamPrimitive[];
export type QueryParams = Record<string, QueryParamValue>;

export type Awaitable<T> = T | Promise<T>;
export type Maybe<T> = T | null | undefined;

export type ClientType = "web" | "ios" | "android";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type UserOnlineStatus = LiteralUnion<"ONLINE" | "OFFLINE" | "INVISIBLE">;
export type Visibility = "PUBLIC" | "FOLLOWERS" | "CIRCLE";
export type ReplyRestriction = "EVERYONE" | "FOLLOWING" | "MENTIONED" | "CIRCLE";

export interface MessageEnvelope {
  message: string;
}

export interface OffsetPagination {
  page?: number;
  limit?: number;
}

export interface CursorPagination {
  limit?: number;
  cursor?: Snowflake | string;
}

export type Pagination = OffsetPagination & CursorPagination;

export interface PageInfo {
  page?: number;
  limit?: number;
  total?: number;
  pages?: number;
  hasNext?: boolean;
  nextCursor?: Snowflake | string | null;
}
