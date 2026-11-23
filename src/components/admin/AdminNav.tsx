"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Group = { label: string; items: { href: string; label: string }[] };

export function AdminNav({ groups }: { groups: Group[] }) {
  const path = usePathname() ?? "/admin/";
  const isActive = (href: string) => (href === "/admin/" ? path === "/admin/" || path === "/admin" : path.startsWith(href));
  return (
    <nav aria-label="CMS" className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-6 lg:overflow-visible lg:px-3 lg:pb-0">
      {groups.map((g) => (
        <div key={g.label} className="contents lg:block">
          <p className="label hidden px-2 pb-2 text-muted lg:block">{g.label}</p>
          <ul className="contents lg:block lg:space-y-0.5">
            {g.items.map((it) => (
              <li key={it.href} className="shrink-0">
                <Link
                  href={it.href}
                  aria-current={isActive(it.href) ? "page" : undefined}
                  className={`block px-2 py-1.5 text-[0.875rem] whitespace-nowrap transition-colors ${
                    isActive(it.href) ? "bg-ink text-white" : "text-ink hover:bg-paper-2"
                  }`}
                >
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
