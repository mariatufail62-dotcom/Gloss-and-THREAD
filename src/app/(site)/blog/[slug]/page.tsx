import { notFound, permanentRedirect, redirect } from "next/navigation";
import { findRedirect } from "@/lib/queries/public";

/** /blog/<slug>/ is not an article URL pattern; honor CMS redirects, otherwise 404. */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function BlogSlug({ params }: Props) {
  const { slug } = await params;
  const r = await findRedirect(`/blog/${decodeURIComponent(slug)}/`);
  if (r) (r.permanent ? permanentRedirect : redirect)(r.toPath);
  notFound();
}
