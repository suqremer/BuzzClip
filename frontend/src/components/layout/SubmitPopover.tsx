"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { apiPost } from "@/lib/api";
import { CATEGORIES } from "@/lib/constants";
import { useT } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/lib/i18n";

const URL_PATTERNS = [
  { regex: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/, platform: "x" as const, icon: "𝕏" },
  { regex: /^https?:\/\/(www\.|m\.)?youtube\.com\/(watch|shorts)/, platform: "youtube" as const, icon: "▶" },
  { regex: /^https?:\/\/youtu\.be\/[A-Za-z0-9_-]+/, platform: "youtube" as const, icon: "▶" },
  { regex: /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/, platform: "tiktok" as const, icon: "♪" },
  { regex: /^https?:\/\/(vm|vt)\.tiktok\.com\/[A-Za-z0-9_-]+/, platform: "tiktok" as const, icon: "♪" },
];

export function SubmitPopover() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);

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

  const detectedPlatform = useMemo(() => {
    const trimmed = url.trim();
    if (!trimmed) return null;
    for (const p of URL_PATTERNS) {
      if (p.regex.test(trimmed)) return p;
    }
    return null;
  }, [url]);

  const toggleCategory = useCallback((slug: string) => {
    setCategories((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length < 3
          ? [...prev, slug]
          : prev,
    );
  }, []);

  const handleSubmit = async () => {
    if (!detectedPlatform || categories.length === 0) return;
    setError("");
    setSubmitting(true);
    try {
      await apiPost("/api/videos", {
        url: url.trim(),
        category_slugs: categories,
        comment: comment || undefined,
      });
      setOpen(false);
      setUrl("");
      setCategories([]);
      setComment("");
      router.push("/ranking");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="text-sm font-medium text-text-primary hover:text-brand-text"
      >
        {t("submitButton")}
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-3 w-96 -translate-x-1/2 rounded-xl border border-border-main bg-surface shadow-lg">
          {!user ? (
            <div className="p-6 text-center">
              <p className="mb-3 text-sm text-text-secondary">{t("loginRequiredPost")}</p>
              <Link
                href="/auth/signin"
                onClick={() => setOpen(false)}
                className="inline-block rounded-lg bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-hover"
              >
                {t("loginButton")}
              </Link>
            </div>
          ) : (
            <div className="p-4">
              <p className="mb-3 text-sm font-bold text-text-heading">{t("submitVideo")}</p>

              {/* URL */}
              <div className="relative mb-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t("pasteVideoUrl")}
                  className="w-full rounded-lg border border-input-border px-3 py-2 pr-8 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
                {detectedPlatform && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base">
                    {detectedPlatform.icon}
                  </span>
                )}
              </div>
              {url.trim() && !detectedPlatform && (
                <p className="mb-3 text-xs text-red-500">{t("invalidVideoUrl")}</p>
              )}

              {/* Categories */}
              <div className="mb-3">
                <p className="mb-1.5 text-xs text-text-secondary">{t("categoryLabelMax3")}</p>
                <div className="flex flex-wrap gap-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => toggleCategory(cat.slug)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium transition ${
                        categories.includes(cat.slug)
                          ? "bg-brand text-white"
                          : "bg-chip-bg text-text-primary hover:bg-chip-hover"
                      }`}
                    >
                      {cat.icon} {t(cat.slug as TranslationKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={200}
                rows={2}
                placeholder={t("commentShortPlaceholder")}
                className="mb-3 w-full rounded-lg border border-input-border px-3 py-2 text-sm placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />

              {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={!detectedPlatform || categories.length === 0 || submitting}
                className="w-full rounded-lg bg-brand py-2 text-sm font-bold text-white transition hover:bg-brand-hover disabled:opacity-50"
              >
                {submitting ? t("submitting") : t("submitButton")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
