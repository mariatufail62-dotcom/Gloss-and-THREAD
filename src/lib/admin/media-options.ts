import "server-only";
import { db } from "@/lib/db";

const select = { id: true, url: true, alt: true, width: true, height: true, filename: true, credit: true, caption: true } as const;

/** Recent media for pickers, always including the currently selected image. */
export async function pickerMedia(selectedId?: string | null) {
  const items = await db.media.findMany({ orderBy: { createdAt: "desc" }, take: 300, select });
  if (selectedId && !items.some((m) => m.id === selectedId)) {
    const extra = await db.media.findUnique({ where: { id: selectedId }, select });
    if (extra) items.unshift(extra);
  }
  return items;
}
