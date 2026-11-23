import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getAuthorArticles, getAuthorBySlug, publishedWhere } from "@/lib/queries/public";
import { authorPath } from "@/lib/urls";
import { pageMetadata } from "@/lib/seo/metadata";
import { profilePageJsonLd } from "@/lib/seo/jsonld";
import { Breadcrumbs, EmptyState, JsonLd } from "@/components/editorial/Common";
import { StoryRow } from "@/components/editorial/StoryCards";

export const revalidate = 600;

export async function generateStaticParams() {
  try {
    return (await db.author.findMany({ where: { isActive: true }, select: { slug: true } })).map((a) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

type Props = { params: Promise<{ slug: string }> };

function socials(v: unknown): { label: string; url: string }[] {
  return Array.isArray(v) ? v.filter((s) => s && typeof s.url === "string" && /^https:\/\//.test(s.url)) : [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const author = await getAuthorBySlug((await params).slug);
  if (!author) return { title: "Not found", robots: { index: false } };
  const count = await db.article.count({ where: { ...publishedWhere(), authorId: author.id } });
  return pageMetadata({
    title: author.name,
    description: author.shortBio || `Stories by ${author.name} at Gloss & Thread.`,
    path: authorPath(author),
    type: "profile",
    index: count > 0,
    image: author.avatar ? { ...author.avatar } : null,
  });
}

export default async function AuthorPage({ params }: Props) {
  const author = await getAuthorBySlug((await params).slug);
  if (!author) notFound();
  const articles = await getAuthorArticles(author.id, 30);
  const links = socials(author.socialLinks);

  return (
    <div className="page-x pt-6 sm:pt-10">
      <JsonLd
        data={profilePageJsonLd({
          path: authorPath(author),
          name: author.name,
          kind: author.kind,
          description: author.shortBio,
          jobTitle: author.jobTitle,
          image: author.avatar?.url,
          sameAs: links.map((l) => l.url),
          createdAt: author.createdAt,
          updatedAt: author.updatedAt,
        })}
      />
      <Breadcrumbs items={[{ name: author.name, path: authorPath(author) }]} />

      <header className="mt-10 grid gap-8 border-b border-line pb-12 md:grid-cols-[auto_1fr] md:gap-12">
        {author.avatar ? (
          <Image src={author.avatar.url} alt={author.avatar.alt || author.name} width={160} height={160} priority className="h-32 w-32 rounded-full object-cover sm:h-40 sm:w-40" />
        ) : (
          <span aria-hidden className="flex h-32 w-32 items-center justify-center rounded-full bg-paper-2 font-serif text-5xl sm:h-40 sm:w-40">
            {author.name.charAt(0)}
          </span>
        )}
        <div className="max-w-3xl">
          <p className="label text-muted">{author.kind === "ORGANIZATION" ? "Editorial desk" : "Contributor"}</p>
          <h1 className="mt-3 font-serif text-[2.5rem] leading-none font-medium sm:text-[3.5rem]">{author.name}</h1>
          {author.jobTitle && <p className="mt-3 text-[1rem] text-muted">{author.jobTitle}</p>}
          {author.bio && (
            <div className="mt-6 space-y-4 text-[1.0625rem] leading-relaxed text-[#3a3a3a]">
              {author.bio.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
          {author.experience && (
            <div className="mt-6">
              <h2 className="label text-muted">Experience</h2>
              <p className="mt-2 text-[1rem] leading-relaxed">{author.experience}</p>
            </div>
          )}
          {links.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-4">
              {links.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer me" className="nav-link border-b border-ink pb-0.5">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      <section aria-labelledby="by-author" className="mt-12">
        <h2 id="by-author" className="section-rule pt-4 pb-8 font-serif text-[1.75rem] font-medium">
          Stories by {author.name}
        </h2>
        {articles.length ? (
          <ul className="divide-y divide-line">
            {articles.map((a) => (
              <li key={a.id} className="py-6 first:pt-0">
                <StoryRow article={a} as="h3" />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No published stories yet" />
        )}
      </section>
    </div>
  );
}
