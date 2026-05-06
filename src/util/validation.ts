import { ValidationError } from "./errors.js";

export function assertObjectResponse(
  value: unknown,
  context: string,
): asserts value is Record<string, unknown> {
  if (!isObject(value)) {
    throw new ValidationError(`${context}: response body is not an object`, {
      code: "VALIDATION_FAILED",
    });
  }
}

export function assertArrayResponse(
  value: unknown,
  key: string,
  context: string,
): void {
  assertObjectResponse(value, context);
  if (!Array.isArray(value[key])) {
    throw new ValidationError(`${context}: response.${key} is not an array`, {
      code: "VALIDATION_FAILED",
    });
  }
}

export function assertNonEmptyText(value: string, fieldName: string): void {
  if (value.trim().length === 0) {
    throw new ValidationError(`${fieldName} must not be empty`, {
      code: "VALIDATION_FAILED",
    });
  }
}

export function assertPositiveInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer`, {
      code: "VALIDATION_FAILED",
    });
  }
}

export function assertAtLeast(
  length: number,
  minimum: number,
  fieldName: string,
): void {
  if (length < minimum) {
    throw new ValidationError(`${fieldName} must contain at least ${minimum} items`, {
      code: "VALIDATION_FAILED",
    });
  }
}

export function assertAtMost(
  length: number,
  maximum: number,
  fieldName: string,
): void {
  if (length > maximum) {
    throw new ValidationError(`${fieldName} must contain at most ${maximum} items`, {
      code: "VALIDATION_FAILED",
    });
  }
}

export function assertValidDate(value: Date | string, fieldName: string): void {
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw new ValidationError(`${fieldName} must be a valid date`, {
      code: "VALIDATION_FAILED",
    });
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
