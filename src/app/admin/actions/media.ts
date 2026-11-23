"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { hasRole, requireUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";
import { deleteUploadFile, processUpload, UploadError } from "@/lib/media";
import { fail, ok, str, type ActionState } from "@/lib/admin/forms";
import { revalidateEverything } from "@/lib/revalidate";
import { mediaUsage } from "@/lib/admin/media-usage";

export type PickerMedia = { id: string; url: string; alt: string; width: number; height: number; filename: string; credit: string | null; caption: string | null };

async function storeUpload(file: File, userId: string, meta: { alt?: string; credit?: string; license?: string }) {
  const processed = await processUpload(file);
  return db.media.create({
    data: {
      ...processed,
      alt: meta.alt?.slice(0, 300) ?? "",
      credit: meta.credit?.slice(0, 200) || null,
      license: meta.license?.slice(0, 200) || null,
      uploadedById: userId,
    },
    select: { id: true, url: true, alt: true, width: true, height: true, filename: true, credit: true, caption: true },
  });
}

export async function uploadMediaAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return fail("Choose at least one image to upload.");
  if (files.length > 12) return fail("Upload at most 12 images at a time.");
  if (!(await rateLimit(`upload:${user.id}`, 120, 3600))) return fail("Upload limit reached. Try again later.");
  if (!str(fd, "rights")) return fail("Confirm that you own or are licensed to publish these images.");

  const done: string[] = [];
  const problems: string[] = [];
  for (const file of files) {
    try {
      const m = await storeUpload(file, user.id, { credit: str(fd, "credit"), license: str(fd, "license") });
      done.push(m.filename);
    } catch (err) {
      problems.push(`${file.name}: ${err instanceof UploadError ? err.message : "could not be processed."}`);
      if (!(err instanceof UploadError)) console.error("[media] upload failed", err);
    }
  }
  if (done.length) {
    await db.activityLog.create({ data: { userId: user.id, action: "media.upload", entityType: "Media", summary: `Uploaded ${done.length} image(s)` } });
  }
  revalidatePath("/admin/media/");
  if (!done.length) return fail("Nothing was uploaded.", { details: problems });
  return ok(`Uploaded ${done.length} image(s). Add alt text to each before using it in an article.`, { details: problems.length ? problems : undefined });
}

/** Called directly from the editor's media picker. */
export async function uploadForPicker(fd: FormData): Promise<{ ok: true; media: PickerMedia } | { ok: false; error: string }> {
  const user = await requireUser();
  const file = fd.get("file");
  if (!(file instanceof File) || !file.size) return { ok: false, error: "Choose an image." };
  if (!str(fd, "alt")) return { ok: false, error: "Alt text is required — describe what the image shows." };
  if (!str(fd, "rights")) return { ok: false, error: "Confirm that you own or are licensed to publish this image." };
  if (!(await rateLimit(`upload:${user.id}`, 120, 3600))) return { ok: false, error: "Upload limit reached. Try again later." };
  try {
    const media = await storeUpload(file, user.id, { alt: str(fd, "alt"), credit: str(fd, "credit"), license: str(fd, "license") });
    await db.activityLog.create({ data: { userId: user.id, action: "media.upload", entityType: "Media", entityId: media.id, summary: `Uploaded ${media.filename}` } });
    return { ok: true, media };
  } catch (err) {
    if (err instanceof UploadError) return { ok: false, error: err.message };
    console.error("[media] picker upload failed", err);
    return { ok: false, error: "The image could not be processed." };
  }
}

const metaSchema = z.object({
  alt: z.string().trim().max(300),
  caption: z.string().trim().max(400).optional(),
  credit: z.string().trim().max(200).optional(),
  creditUrl: z.string().trim().url("Credit link must be a full URL.").max(500).optional(),
  license: z.string().trim().max(200).optional(),
});

export async function updateMediaAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = str(fd, "id");
  const media = id ? await db.media.findUnique({ where: { id } }) : null;
  if (!media) return fail("Image not found.");
  if (!hasRole(user, "EDITOR") && media.uploadedById !== user.id) return fail("You can only edit images you uploaded.");
  const parsed = metaSchema.safeParse({
    alt: str(fd, "alt") ?? "",
    caption: str(fd, "caption"),
    credit: str(fd, "credit"),
    creditUrl: str(fd, "creditUrl"),
    license: str(fd, "license"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  await db.media.update({
    where: { id: media.id },
    data: { alt: parsed.data.alt, caption: parsed.data.caption ?? null, credit: parsed.data.credit ?? null, creditUrl: parsed.data.creditUrl ?? null, license: parsed.data.license ?? null },
  });
  revalidatePath(`/admin/media/${media.id}/`);
  revalidateEverything(); // alt text / credits render across many public pages
  return ok("Image details saved.");
}

export async function deleteMediaAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("EDITOR");
  const id = str(fd, "id");
  const media = id ? await db.media.findUnique({ where: { id } }) : null;
  if (!media) return fail("Image not found.");
  const u = await mediaUsage(media.id);
  const count = u.featured.length + u.avatars.length + u.products.length + u.inBody.length;
  if (count) return fail(`This image is still used in ${count} place(s). Replace it there first.`);
  await db.media.delete({ where: { id: media.id } });
  await deleteUploadFile(media.url);
  await db.activityLog.create({ data: { userId: user.id, action: "media.delete", entityType: "Media", entityId: media.id, summary: `Deleted ${media.filename}` } });
  revalidatePath("/admin/media/");
  redirect("/admin/media/?deleted=1");
}
