"use client";

import { useId, useMemo, useState } from "react";

export type PickOption = { id: string; label: string; hint?: string; disabled?: boolean };

/** Ordered multi-select with search. Keeps the editor dependency-free. */
export function MultiPick({
  options,
  value,
  onChange,
  max,
  placeholder = "Search…",
}: {
  options: PickOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  max: number;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const listId = useId();
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return options.filter((o) => !value.includes(o.id) && o.label.toLowerCase().includes(t)).slice(0, 8);
  }, [q, options, value]);

  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      {value.length > 0 && (
        <ol className="mb-2 divide-y divide-line border border-line">
          {value.map((id, i) => (
            <li key={id} className="flex items-center gap-2 px-3 py-2 text-[0.8125rem]">
              <span className="w-4 text-muted">{i + 1}.</span>
              <span className="min-w-0 flex-1 truncate">
                {byId.get(id)?.label ?? <em className="text-rose-dark">Unavailable item</em>}
                {byId.get(id)?.hint && <span className="ml-2 text-[0.6875rem] text-muted">{byId.get(id)!.hint}</span>}
              </span>
              <button type="button" onClick={() => move(i, -1)} aria-label="Move up" className="px-1 text-muted hover:text-ink">↑</button>
              <button type="button" onClick={() => move(i, 1)} aria-label="Move down" className="px-1 text-muted hover:text-ink">↓</button>
              <button type="button" onClick={() => onChange(value.filter((v) => v !== id))} aria-label="Remove" className="px-1 text-muted hover:text-rose-dark">✕</button>
            </li>
          ))}
        </ol>
      )}
      {value.length < max ? (
        <div className="relative">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className="field"
            aria-controls={listId}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const first = matches.find((m) => !m.disabled);
                if (first) {
                  onChange([...value, first.id]);
                  setQ("");
                }
              }
            }}
          />
          {matches.length > 0 && (
            <ul id={listId} className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto border border-line bg-white shadow-sm">
              {matches.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    disabled={m.disabled}
                    onClick={() => {
                      onChange([...value, m.id]);
                      setQ("");
                    }}
                    className="block w-full px-3 py-2 text-left text-[0.8125rem] hover:bg-paper-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {m.label}
                    {m.hint && <span className="ml-2 text-[0.6875rem] text-muted">{m.hint}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="text-[0.75rem] text-muted">Maximum of {max} reached.</p>
      )}
    </div>
  );
}
