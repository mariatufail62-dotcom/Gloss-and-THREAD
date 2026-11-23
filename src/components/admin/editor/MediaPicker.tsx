"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";
import { uploadForPicker, type PickerMedia } from "@/app/admin/actions/media";

/** Shared media list so an image uploaded in one picker is available in all of them. */
export function useMediaLibrary(initial: PickerMedia[]) {
  const [items, setItems] = useState(initial);
  const byId = useMemo(() => new Map(items.map((m) => [m.id, m])), [items]);
  return { items, byId, add: (m: PickerMedia) => setItems((xs) => [m, ...xs.filter((x) => x.id !== m.id)]) };
}
export type MediaLibrary = ReturnType<typeof useMediaLibrary>;

export function MediaThumb({ media, className = "" }: { media: PickerMedia | undefined; className?: string }) {
  if (!media) return <div className={`flex items-center justify-center bg-paper-2 text-[0.75rem] text-muted ${className}`}>Missing image</div>;
  return (
    <div className={`relative overflow-hidden bg-paper-2 ${className}`}>
      <Image src={media.url} alt={media.alt} fill sizes="200px" className="object-cover" />
    </div>
  );
}

export function MediaPickerButton({
  library,
  onPick,
  label = "Choose image",
  className = "btn-outline",
}: {
  library: MediaLibrary;
  onPick: (m: PickerMedia) => void;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const uploadRef = useRef<HTMLFormElement>(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return library.items;
    return library.items.filter((m) => `${m.alt} ${m.filename} ${m.credit ?? ""} ${m.caption ?? ""}`.toLowerCase().includes(t));
  }, [library.items, q]);

  const pick = (m: PickerMedia) => {
    onPick(m);
    ref.current?.close();
  };

  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.showModal()}>
        {label}
      </button>
      <dialog ref={ref} className="m-auto w-[min(64rem,calc(100vw-2rem))] border border-line bg-white p-0 backdrop:bg-ink/40">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
          <p className="label">Media library</p>
          <button type="button" onClick={() => ref.current?.close()} className="text-[0.875rem] underline">
            Close
          </button>
        </div>
        <div className="grid max-h-[75vh] gap-6 overflow-y-auto p-5 lg:grid-cols-[1fr_17rem]">
          <div>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search alt text, filename, credit…" className="field mb-4" aria-label="Search media" />
            {filtered.length === 0 ? (
              <p className="py-10 text-center text-[0.875rem] text-muted">No images match. Upload one on the right.</p>
            ) : (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {filtered.map((m) => (
                  <li key={m.id}>
                    <button type="button" onClick={() => pick(m)} className="group block w-full text-left">
                      <MediaThumb media={m} className="aspect-square ring-ink group-hover:ring-2 group-focus-visible:ring-2" />
                      <span className={`mt-1 block truncate text-[0.6875rem] ${m.alt ? "text-muted" : "font-semibold text-rose-dark"}`}>{m.alt || "No alt text"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <form
            ref={uploadRef}
            className="space-y-3 border-t border-line pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              setError(null);
              start(async () => {
                const r = await uploadForPicker(fd);
                if (!r.ok) return setError(r.error);
                library.add(r.media);
                uploadRef.current?.reset();
                pick(r.media);
              });
            }}
          >
            <p className="label">Upload new</p>
            <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif" required className="block w-full text-[0.8125rem]" />
            <input name="alt" placeholder="Alt text (describe the image)" required maxLength={300} className="field" />
            <input name="credit" placeholder="Credit (photographer / source)" maxLength={200} className="field" />
            <input name="license" placeholder="License (e.g. Owned, Licensed — Agency)" maxLength={200} className="field" />
            <label className="flex items-start gap-2 text-[0.75rem]">
              <input type="checkbox" name="rights" required className="mt-0.5 accent-ink" />I own this image or am licensed to publish it.
            </label>
            {error && <p role="alert" className="text-[0.75rem] font-medium text-rose-dark">{error}</p>}
            <button type="submit" disabled={pending} className="btn-dark w-full disabled:opacity-50">
              {pending ? "Uploading…" : "Upload & use"}
            </button>
            <p className="text-[0.6875rem] leading-relaxed text-muted">JPEG, PNG, WebP or AVIF up to 10 MB, at least 400×300. Images are converted to WebP and stripped of location metadata.</p>
          </form>
        </div>
      </dialog>
    </>
  );
}

/** A single image field: preview + choose/remove, with a hidden input for forms. */
export function MediaField({ name, library, value, onChange }: { name?: string; library: MediaLibrary; value: string | null; onChange: (id: string | null) => void }) {
  const media = value ? library.byId.get(value) : undefined;
  return (
    <div>
      {name && <input type="hidden" name={name} value={value ?? ""} />}
      {value ? (
        <div className="space-y-2">
          <MediaThumb media={media} className="aspect-[4/3] w-full" />
          {media && !media.alt && <p className="text-[0.75rem] font-medium text-rose-dark">This image has no alt text — add it in the media library.</p>}
          <div className="flex gap-3">
            <MediaPickerButton library={library} onPick={(m) => onChange(m.id)} label="Replace" className="text-[0.8125rem] font-semibold underline" />
            <button type="button" onClick={() => onChange(null)} className="text-[0.8125rem] text-muted underline">
              Remove
            </button>
            {media && (
              <a href={`/admin/media/${media.id}/`} target="_blank" className="ml-auto text-[0.8125rem] text-muted underline">
                Edit details ↗
              </a>
            )}
          </div>
        </div>
      ) : (
        <MediaPickerButton library={library} onPick={(m) => onChange(m.id)} />
      )}
    </div>
  );
}

/** Image field for simple CMS forms (products, authors). */
export function StandaloneMediaField({ name, media, value }: { name: string; media: PickerMedia[]; value: string | null }) {
  const library = useMediaLibrary(media);
  const [current, setCurrent] = useState<string | null>(value);
  return <MediaField name={name} library={library} value={current} onChange={setCurrent} />;
}
