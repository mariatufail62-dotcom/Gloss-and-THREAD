"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { NavItem } from "@/lib/queries/navigation";
import { ChevronIcon, CloseIcon, MenuIcon, SearchIcon } from "./Icons";

/** Accessible mobile drawer with expandable category sections. */
export function MobileMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="-ml-2 flex h-11 w-11 items-center justify-center"
      >
        <MenuIcon />
        <span className="sr-only">Open menu</span>
      </button>

      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        inert={!open}
        className={`fixed inset-y-0 left-0 z-50 flex w-[88vw] max-w-sm flex-col bg-white transition-transform duration-250 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <span className="font-serif text-[1.05rem] tracking-(--tracking-wordmark)">
            GLOSS <em className="text-rose">&amp;</em> THREAD
          </span>
          <button ref={closeRef} type="button" onClick={() => setOpen(false)} className="-mr-2 flex h-11 w-11 items-center justify-center">
            <CloseIcon />
            <span className="sr-only">Close menu</span>
          </button>
        </div>

        <form action="/search/" method="get" role="search" className="border-b border-line px-4 py-4">
          <label htmlFor="m-search" className="sr-only">
            Search Gloss &amp; Thread
          </label>
          <div className="flex items-center border border-line focus-within:border-ink">
            <input id="m-search" name="q" type="search" placeholder="Search stories" className="min-h-11 flex-1 bg-transparent px-3 text-[0.9375rem] outline-none" />
            <button type="submit" className="flex h-11 w-11 items-center justify-center">
              <SearchIcon />
              <span className="sr-only">Search</span>
            </button>
          </div>
        </form>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-4 pb-10">
          <ul>
            {items.map((item) => (
              <li key={item.href} className="border-b border-line">
                {item.children.length ? (
                  <details className="group">
                    <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between py-3 [&::-webkit-details-marker]:hidden">
                      <span className="nav-link text-[0.8125rem]">{item.label}</span>
                      <ChevronIcon className="h-4 w-4 transition-transform group-open:rotate-180" />
                    </summary>
                    <ul className="pb-4 pl-1">
                      <li>
                        <Link href={item.href} className="flex min-h-11 items-center text-[0.9375rem] font-medium">
                          All {item.label}
                        </Link>
                      </li>
                      {item.children.map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} className="flex min-h-11 items-center text-[0.9375rem] text-muted">
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <Link href={item.href} className="nav-link flex min-h-13 items-center py-3 text-[0.8125rem]">
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <ul className="mt-6 space-y-1 text-[0.875rem] text-muted">
            <li><Link href="/about/" className="flex min-h-10 items-center">About</Link></li>
            <li><Link href="/contact/" className="flex min-h-10 items-center">Contact</Link></li>
            <li><Link href="/editorial-policy/" className="flex min-h-10 items-center">Editorial Policy</Link></li>
          </ul>
        </nav>
      </div>
    </>
  );
}
