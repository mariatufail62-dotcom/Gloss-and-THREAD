import Link from "next/link";

/** Original text wordmark: Playfair caps, wide tracking, italic rose ampersand. */
export function Wordmark({ size = "lg", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const s =
    size === "lg"
      ? "text-[2.5rem] xl:text-[2.85rem]"
      : size === "md"
        ? "text-[1.6rem]"
        : "text-[0.98rem] min-[360px]:text-[1.15rem] sm:text-[1.3rem]";
  return (
    <Link href="/" aria-label="Gloss & Thread — home" className={`inline-block leading-none ${className}`}>
      <span
        className={`font-serif font-medium whitespace-nowrap tracking-(--tracking-wordmark) ${s}`}
        style={{ marginRight: "-0.22em" }}
      >
        GLOSS <em className="font-normal italic text-rose">&amp;</em> THREAD
      </span>
    </Link>
  );
}
