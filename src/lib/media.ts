import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { env } from "@/lib/env";
import { slugify } from "@/lib/site";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_EDGE = 2400;
const FILE_RE = /^[a-z0-9-]+\.webp$/;

function uploadRoot() {
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), env.uploadDir);
}

export function resolveUploadPath(filename: string): string | null {
  if (!FILE_RE.test(filename)) return null;
  const full = path.join(/*turbopackIgnore: true*/ uploadRoot(), filename);
  if (!full.startsWith(uploadRoot() + path.sep)) return null;
  return full;
}

export class UploadError extends Error {}

/**
 * Validates and normalizes an uploaded image:
 * - checks declared type, size and *actual* decoded format (not just the extension)
 * - auto-rotates, strips metadata (EXIF/GPS), caps the long edge, encodes WebP
 */
export async function processUpload(file: File) {
  if (!ALLOWED_MIME.has(file.type)) throw new UploadError("Only JPEG, PNG, WebP or AVIF images are allowed.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("Images must be 10 MB or smaller.");
  if (file.size === 0) throw new UploadError("The file is empty.");

  const input = Buffer.from(await file.arrayBuffer());
  let meta: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw new UploadError("The file is not a readable image.");
  }
  if (!meta.format || !["jpeg", "png", "webp", "heif", "avif"].includes(meta.format))
    throw new UploadError("Unsupported image format.");
  if (!meta.width || !meta.height || meta.width < 400 || meta.height < 300)
    throw new UploadError("Images must be at least 400×300 pixels for editorial use.");
  if (meta.width * meta.height > 60_000_000) throw new UploadError("Image dimensions are too large.");

  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const base = slugify(file.name.replace(/\.[a-z0-9]+$/i, "")) || "image";
  const filename = `${base.slice(0, 60)}-${randomBytes(4).toString("hex")}.webp`;
  await mkdir(uploadRoot(), { recursive: true });
  await writeFile(path.join(uploadRoot(), filename), data);

  return {
    filename,
    url: `/media/${filename}`,
    mimeType: "image/webp",
    width: info.width,
    height: info.height,
    sizeBytes: info.size,
    originalName: file.name.slice(0, 200),
  };
}

export async function readUpload(filename: string): Promise<Buffer | null> {
  const full = resolveUploadPath(filename);
  if (!full) return null;
  try {
    return await readFile(/*turbopackIgnore: true*/ full);
  } catch {
    return null;
  }
}

export async function deleteUploadFile(url: string) {
  if (!url.startsWith("/media/")) return; // bundled demo visuals are never deleted from disk
  const full = resolveUploadPath(url.slice("/media/".length));
  if (full) await unlink(full).catch(() => {});
}
