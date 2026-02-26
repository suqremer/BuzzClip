"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/hooks/useTranslation";

export function SearchPopover() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    setQuery("");
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="text-sm font-medium text-text-primary hover:text-brand-text"
      >
        {t("search")}
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-3 w-80 -translate-x-1/2 rounded-xl border border-border-main bg-surface p-4 shadow-lg">
          <form onSubmit={handleSearch}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchInputPlaceholder")}
                className="flex-1 rounded-lg border border-input-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <button
                type="submit"
                disabled={!query.trim()}
                className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-50"
              >
                {t("search")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
