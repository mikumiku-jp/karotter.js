import type {
  CursorPagination,
  OffsetPagination,
  PageInfo,
  Snowflake,
} from "./types.js";

export interface AutoPaginationOptions {
  limit?: number;
  maxItems?: number;
}

export interface OffsetPaginationOptions extends AutoPaginationOptions {
  startPage?: number;
}

export interface CursorPaginationOptions extends AutoPaginationOptions {
  startCursor?: Snowflake | string;
}

interface PageLike {
  pagination?: PageInfo;
}

interface Identifiable {
  id: Snowflake | string;
}

export async function* iterateOffsetPages<
  Item,
  Response extends PageLike,
  Query extends OffsetPagination,
>(
  loadPage: (query: Query) => Promise<Response>,
  selectItems: (response: Response) => Item[],
  query: Query,
  options: OffsetPaginationOptions = {},
): AsyncGenerator<Item> {
  const limit = options.limit ?? query.limit ?? 100;
  let page = options.startPage ?? query.page ?? 1;
  let emitted = 0;

  while (options.maxItems === undefined || emitted < options.maxItems) {
    const response = await loadPage({ ...query, page, limit });
    const items = selectItems(response);
    if (items.length === 0) return;

    for (const item of items) {
      if (options.maxItems !== undefined && emitted >= options.maxItems) return;
      emitted += 1;
      yield item;
    }

    if (response.pagination?.hasNext === false) return;
    if (response.pagination?.pages !== undefined && page >= response.pagination.pages) return;
    if (items.length < limit) return;
    page += 1;
  }
}

export async function* iterateCursorPages<
  Item extends Identifiable,
  Response extends PageLike,
  Query extends CursorPagination,
>(
  loadPage: (query: Query) => Promise<Response>,
  selectItems: (response: Response) => Item[],
  query: Query,
  options: CursorPaginationOptions = {},
): AsyncGenerator<Item> {
  const limit = options.limit ?? query.limit ?? 100;
  let cursor = options.startCursor ?? query.cursor;
  let emitted = 0;

  while (options.maxItems === undefined || emitted < options.maxItems) {
    const response = await loadPage({ ...query, cursor, limit });
    const items = selectItems(response);
    if (items.length === 0) return;

    for (const item of items) {
      if (options.maxItems !== undefined && emitted >= options.maxItems) return;
      emitted += 1;
      yield item;
    }

    if (response.pagination?.hasNext === false) return;
    const nextCursor = response.pagination?.nextCursor ?? items[items.length - 1]?.id;
    if (nextCursor === undefined || nextCursor === null || nextCursor === cursor) return;
    if (response.pagination?.hasNext !== true && items.length < limit) return;
    cursor = nextCursor;
  }
}
