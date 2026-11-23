import { readUpload } from "@/lib/media";

/**
 * Serves uploaded images from UPLOAD_DIR. Filenames are generated server-side
 * and validated against a strict pattern, so path traversal is impossible.
 * In production, point UPLOAD_DIR at a persistent volume or front this with a CDN.
 */
type Ctx = { params: Promise<{ file: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { file } = await params;
  const data = await readUpload(file);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
