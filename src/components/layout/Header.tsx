import Link from "next/link";
import { getNavigation } from "@/lib/queries/navigation";
import { SITE_TAGLINE } from "@/lib/site";
import { Wordmark } from "./Wordmark";
import { MobileMenu } from "./MobileMenu";
import { SearchIcon } from "./Icons";

/**
 * Editorial header. On desktop the whole header is sticky with a negative
 * offset equal to the top bar + masthead height, so only the navigation row
 * stays pinned — CSS only, no scroll listeners, no layout shift.
 */
export async function Header() {
  const items = await getNavigation();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white lg:-top-[148px]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      {/* Top bar (desktop) */}
      <div className="hidden h-9 border-b border-line lg:block">
        <div className="page-x flex h-full items-center justify-between text-[0.6875rem] tracking-[0.08em] text-muted">
          <p className="uppercase">{SITE_TAGLINE}</p>
          <ul className="flex items-center gap-6 uppercase">
            <li><Link href="/about/" className="hover:text-ink">About</Link></li>
            <li><Link href="/editorial-policy/" className="hover:text-ink">Editorial Standards</Link></li>
            <li><Link href="/contact/" className="hover:text-ink">Contact</Link></li>
          </ul>
        </div>
      </div>

      {/* Masthead (desktop) */}
      <div className="hidden h-28 lg:block">
        <div className="page-x grid h-full grid-cols-[1fr_auto_1fr] items-center">
          <div />
          <Wordmark size="lg" />
          <div className="flex justify-end">
            <Link href="/#newsletter" className="nav-link border-b border-transparent pb-0.5 hover:border-ink">
              Newsletter
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile bar */}
      <div className="page-x grid h-16 grid-cols-[2.75rem_1fr_2.75rem] items-center lg:hidden">
        <MobileMenu items={items} />
        <div className="text-center">
          <Wordmark size="sm" />
        </div>
        <Link href="/search/" className="-mr-2 flex h-11 w-11 items-center justify-center justify-self-end">
          <SearchIcon />
          <span className="sr-only">Search</span>
        </Link>
      </div>

      {/* Desktop navigation row (the part that stays pinned) */}
      <nav aria-label="Primary" className="relative hidden h-12 border-t border-line lg:block">
        <div className="page-x flex h-full items-center justify-between">
          <span className="w-10" aria-hidden />
          <ul className="flex h-full items-center gap-1 xl:gap-3">
            {items.map((item) => (
              <li key={item.href} className="group static flex h-full items-center">
                <Link
                  href={item.href}
                  className="nav-link relative flex h-full items-center px-2.5 after:absolute after:inset-x-2.5 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-ink after:transition-transform group-hover:after:scale-x-100 xl:px-3"
                  aria-haspopup={item.children.length ? "true" : undefined}
                >
                  {item.label}
                </Link>
                {item.children.length > 0 && (
                  <div
                    className="invisible absolute inset-x-0 top-full z-40 border-y border-line bg-white opacity-0 transition-[opacity,visibility] delay-75 duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
                  >
                    <div className="page-x grid grid-cols-[14rem_1fr_1.3fr] gap-10 py-9">
                      <div>
                        <p className="font-serif text-[1.75rem] leading-none">{item.label}</p>
                        <Link href={item.href} className="nav-link mt-5 inline-block border-b border-ink pb-1 hover:text-rose-dark">
                          View all {item.label}
                        </Link>
                      </div>
                      <ul className="grid content-start gap-y-1">
                        {item.children.map((c) => (
                          <li key={c.href}>
                            <Link href={c.href} className="block py-1.5 text-[0.9375rem] hover:text-rose-dark">
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      {item.latest.length > 0 && (
                        <div className="border-l border-line pl-10">
                          <p className="label text-muted">Latest in {item.label}</p>
                          <ul className="mt-4 space-y-4">
                            {item.latest.map((a) => (
                              <li key={a.href}>
                                <Link href={a.href} className="font-serif text-[1.125rem] leading-snug hover:text-rose-dark">
                                  {a.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <Link href="/search/" className="flex h-10 w-10 items-center justify-center hover:text-rose-dark">
            <SearchIcon />
            <span className="sr-only">Search</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
