import Link from "next/link";
import { db } from "@/lib/db";
import { hasRole, requireUser } from "@/lib/auth/session";
import { logoutAction } from "../actions/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unread = hasRole(user, "EDITOR") ? await db.contactMessage.count({ where: { isRead: false } }) : 0;

  const groups = [
    {
      label: "Content",
      items: [
        { href: "/admin/", label: "Dashboard" },
        { href: "/admin/articles/", label: "Articles" },
        { href: "/admin/media/", label: "Media library" },
        ...(hasRole(user, "EDITOR")
          ? [
              { href: "/admin/products/", label: "Products" },
              { href: "/admin/homepage/", label: "Homepage" },
            ]
          : []),
      ],
    },
    ...(hasRole(user, "EDITOR")
      ? [
          {
            label: "Structure",
            items: [
              { href: "/admin/categories/", label: "Categories & nav" },
              { href: "/admin/authors/", label: "Authors" },
              { href: "/admin/redirects/", label: "Redirects" },
              { href: "/admin/seo/", label: "SEO checklist" },
            ],
          },
          {
            label: "Inbox",
            items: [{ href: "/admin/messages/", label: unread ? `Messages (${unread})` : "Messages" }],
          },
        ]
      : []),
    ...(hasRole(user, "ADMIN")
      ? [
          {
            label: "Admin",
            items: [
              { href: "/admin/settings/", label: "Site settings" },
              { href: "/admin/users/", label: "Users" },
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-line bg-white lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 py-5">
            <Link href="/admin/" className="font-serif text-[1.05rem] tracking-[0.18em] whitespace-nowrap">
              G <em className="text-rose">&amp;</em> T <span className="label ml-1 align-middle text-muted">CMS</span>
            </Link>
            <Link href="/" target="_blank" className="label text-muted hover:text-ink lg:hidden">
              View site ↗
            </Link>
          </div>
          <AdminNav groups={groups} />
          <div className="mt-auto hidden border-t border-line px-5 py-4 text-[0.8125rem] lg:block">
            <p className="font-semibold">{user.name}</p>
            <p className="text-[0.75rem] text-muted">{user.role.toLowerCase()}</p>
            <div className="mt-3 flex items-center gap-4">
              <Link href="/admin/account/" className="text-muted underline-offset-2 hover:text-ink hover:underline">
                Account
              </Link>
              <Link href="/" target="_blank" className="text-muted underline-offset-2 hover:text-ink hover:underline">
                View site ↗
              </Link>
            </div>
            <form action={logoutAction} className="mt-3">
              <button type="submit" className="text-[0.8125rem] font-semibold underline underline-offset-2 hover:text-rose-dark">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0 px-4 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[78rem]">{children}</div>
        <div className="mt-16 flex items-center justify-between border-t border-line pt-4 text-[0.75rem] text-muted lg:hidden">
          <span>
            {user.name} · {user.role.toLowerCase()} · <Link href="/admin/account/" className="underline">Account</Link>
          </span>
          <form action={logoutAction}>
            <button type="submit" className="font-semibold underline">Sign out</button>
          </form>
        </div>
      </div>
    </div>
  );
}
