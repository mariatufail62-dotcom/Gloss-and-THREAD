import { getSetting } from "@/lib/settings";

export const revalidate = 3600;

/** ads.txt is managed in Admin → Settings → Advertising. Returns 404 until configured. */
export async function GET() {
  const ads = await getSetting("ads");
  const body = ads.adsTxt.trim();
  if (!body) return new Response("Not found", { status: 404 });
  return new Response(body + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
