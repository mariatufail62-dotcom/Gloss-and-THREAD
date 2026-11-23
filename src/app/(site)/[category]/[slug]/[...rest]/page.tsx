import { notFound, permanentRedirect, redirect } from "next/navigation";
import { findRedirect } from "@/lib/queries/public";

/** Deep unknown paths: honor CMS redirects, otherwise a real 404. */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category: string; slug: string; rest: string[] }> };

export default async function DeepPath({ params }: Props) {
  const { category, slug, rest } = await params;
  const path = `/${[category, slug, ...rest].map(decodeURIComponent).join("/")}/`;
  const r = await findRedirect(path);
  if (r) (r.permanent ? permanentRedirect : redirect)(r.toPath);
  notFound();
}
