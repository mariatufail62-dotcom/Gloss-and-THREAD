"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page-x py-24 text-center sm:py-32">
      <p className="label text-rose">Something went wrong</p>
      <h1 className="mt-4 font-serif text-[2.25rem] leading-tight font-medium sm:text-[3rem]">We couldn&apos;t load this page</h1>
      <p className="mx-auto mt-5 max-w-lg text-[1rem] leading-relaxed text-muted">
        This is on us, not you. Please try again in a moment.
        {error.digest && <span className="mt-2 block text-[0.8125rem]">Reference: {error.digest}</span>}
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-dark">Try again</button>
        <Link href="/" className="btn-outline">Go home</Link>
      </div>
    </div>
  );
}
