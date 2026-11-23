import Link from "next/link";
import { SearchIcon } from "@/components/layout/Icons";

export default function NotFound() {
  return (
    <div className="page-x py-24 text-center sm:py-32">
      <p className="label text-rose">404</p>
      <h1 className="mt-4 font-serif text-[2.5rem] leading-tight font-medium sm:text-[3.5rem]">This page has gone out of style</h1>
      <p className="mx-auto mt-5 max-w-lg text-[1.0625rem] leading-relaxed text-muted">
        The page you&apos;re looking for doesn&apos;t exist or may have moved. Try a search, or start from our latest stories.
      </p>
      <form action="/search/" method="get" role="search" className="mx-auto mt-10 max-w-md">
        <label htmlFor="nf-q" className="sr-only">Search</label>
        <div className="flex items-center border-b border-ink">
          <input id="nf-q" name="q" type="search" placeholder="Search Gloss & Thread" className="min-h-12 flex-1 bg-transparent text-[1rem] outline-none" />
          <button type="submit" className="flex h-12 w-12 items-center justify-center">
            <SearchIcon />
            <span className="sr-only">Search</span>
          </button>
        </div>
      </form>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-dark">Home</Link>
        <Link href="/blog/" className="btn-outline">Latest stories</Link>
      </div>
    </div>
  );
}
