import Image from "next/image";
import type { MediaItem } from "@/lib/queries/public";

type Ratio = "4/5" | "3/4" | "2/3" | "1/1" | "4/3" | "3/2" | "16/9" | "21/9" | "auto";

const ratioClass: Record<Exclude<Ratio, "auto">, string> = {
  "4/5": "aspect-[4/5]",
  "3/4": "aspect-[3/4]",
  "2/3": "aspect-[2/3]",
  "1/1": "aspect-square",
  "4/3": "aspect-[4/3]",
  "3/2": "aspect-[3/2]",
  "16/9": "aspect-video",
  "21/9": "aspect-[21/9]",
};

interface Props {
  media: Pick<MediaItem, "url" | "width" | "height" | "alt"> | null | undefined;
  ratio?: Ratio;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  /** Pass "" for decorative images whose meaning is carried by adjacent text. */
  altOverride?: string;
  quality?: 60 | 75 | 85;
  hoverZoom?: boolean;
}

/**
 * Every editorial image reserves its box via aspect-ratio before load (no CLS),
 * uses responsive srcsets, and is lazy unless it is the LCP candidate.
 */
export function EditorialImage({
  media,
  ratio = "4/5",
  sizes,
  priority,
  className = "",
  imgClassName = "",
  altOverride,
  quality = 75,
  hoverZoom,
}: Props) {
  const alt = altOverride ?? media?.alt ?? "";

  if (ratio === "auto" && media) {
    return (
      <div className={`overflow-hidden bg-paper-2 ${className}`}>
        <Image
          src={media.url}
          alt={alt}
          width={media.width}
          height={media.height}
          sizes={sizes}
          priority={priority}
          fetchPriority={priority ? "high" : undefined}
          quality={quality}
          className={`h-auto w-full ${imgClassName}`}
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-paper-2 ${ratio !== "auto" ? ratioClass[ratio] : "aspect-[4/5]"} ${className}`}>
      {media ? (
        <Image
          src={media.url}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          fetchPriority={priority ? "high" : undefined}
          quality={quality}
          className={`object-cover ${hoverZoom ? "transition-transform duration-700 ease-out group-hover:scale-[1.03]" : ""} ${imgClassName}`}
        />
      ) : (
        <div aria-hidden className="absolute inset-0 flex items-center justify-center">
          <span className="font-serif text-2xl tracking-(--tracking-wordmark) text-line">G&amp;T</span>
        </div>
      )}
    </div>
  );
}
