export type MediaInput =
  | Blob
  | File
  | {
      data: Buffer | Uint8Array | Blob;
      filename?: string;
      type?: string;
    };

export function appendField(form: FormData, key: string, value: unknown): void {
  if (value === undefined || value === null) return;
  if (typeof value === "boolean") {
    form.append(key, value ? "true" : "false");
    return;
  }
  if (typeof value === "number" || typeof value === "bigint") {
    form.append(key, String(value));
    return;
  }
  if (value instanceof Date) {
    form.append(key, value.toISOString());
    return;
  }
  if (typeof value === "string") {
    form.append(key, value);
    return;
  }
  form.append(key, JSON.stringify(value));
}

export function appendJson(form: FormData, key: string, value: unknown): void {
  if (value === undefined) return;
  form.append(key, JSON.stringify(value ?? null));
}

export function appendMedia(form: FormData, key: string, media: MediaInput): void {
  if (typeof File !== "undefined" && media instanceof File) {
    form.append(key, media, media.name);
    return;
  }
  if (typeof Blob !== "undefined" && media instanceof Blob) {
    form.append(key, media, defaultFilename(media.type));
    return;
  }
  if (typeof media === "object" && "data" in media) {
    if (typeof Blob === "undefined") {
      throw new TypeError(
        "Blob is unavailable. Use Node 18+ or polyfill globalThis.Blob.",
      );
    }
    const mime = media.type ?? "application/octet-stream";
    const blob =
      media.data instanceof Blob
        ? media.data
        : new Blob([media.data as BlobPart], { type: mime });
    form.append(key, blob, media.filename ?? defaultFilename(mime));
    return;
  }
  throw new TypeError("Unsupported media payload");
}

function defaultFilename(mime: string | undefined): string {
  const ext =
    typeof mime === "string" && mime.includes("/")
      ? (mime.split("/")[1] ?? "bin")
      : "bin";
  return `upload.${ext}`;
}
