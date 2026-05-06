import type { QueryParams, QueryParamValue } from "../util/types.js";

export function encodeId(id: number | string): string {
  return encodeURIComponent(String(id));
}

export function encodeQuery<T extends object>(
  query: T | undefined,
): { params: QueryParams } | Record<string, never> {
  if (!query) return {};
  const params: QueryParams = {};
  for (const [key, value] of Object.entries(query) as Array<
    [string, QueryParamValue]
  >) {
    if (value !== undefined && value !== null) params[key] = value;
  }
  return Object.keys(params).length > 0 ? { params } : {};
}
