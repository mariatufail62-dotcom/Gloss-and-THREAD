import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic admin guard: requests without a session cookie are sent to the
 * login page before any admin code runs. The real authorization check
 * (session lookup + role) happens server-side in every admin page and action.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isLogin = pathname === "/admin/login/" || pathname === "/admin/login";
  const hasSession = request.cookies.has("gt_session");

  if (!isLogin && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login/";
    url.search = "";
    const next = pathname + search;
    if (next.startsWith("/admin") && next !== "/admin/") url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
