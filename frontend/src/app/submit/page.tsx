"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { UrlInput } from "@/components/submit/UrlInput";
import { CategorySelect } from "@/components/submit/CategorySelect";
import { useT } from "@/hooks/useTranslation";

interface SubmitResponse {
  id: string;
}

export default function SubmitPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = useT();
  const [url, setUrl] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (authLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-medium border-t-brand" role="status" aria-label={t("loading")} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-text-heading">{t("loginRequired")}</h1>
        <p className="mt-3 text-text-secondary">
          {t("loginRequiredSubmit")}
        </p>
        <Link
          href="/auth/signin"
          className="mt-6 inline-block rounded-lg bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-hover"
        >
          {t("loginButton")}
        </Link>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!url) return;
    if (categories.length === 0) {
      setError(t("selectCategoryError"));
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await apiPost<SubmitResponse>("/api/videos", {
        url: url,
        category_slugs: categories,
        comment: comment || undefined,
      });
      router.push("/ranking");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t("submitFailed")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">{t("submitVideo")}</h1>
      <p className="mb-8 text-sm text-text-secondary">
        {t("submitDesc")}
      </p>

      <div className="space-y-6">
        {/* Step 1: URL */}
        <div className="rounded-xl border border-border-main bg-surface p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              1
            </span>
            <span className="font-medium">{t("enterUrl")}</span>
          </div>
          <UrlInput onValidUrl={setUrl} />
          {url && (
            <p className="mt-2 text-sm text-green-600">
              {t("urlVerified")}
            </p>
          )}
        </div>

        {/* Step 2: Category */}
        <div className="rounded-xl border border-border-main bg-surface p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              2
            </span>
            <span className="font-medium">{t("selectCategory")}</span>
          </div>
          <CategorySelect selected={categories} onChange={setCategories} />
        </div>

        {/* Step 3: Comment */}
        <div className="rounded-xl border border-border-main bg-surface p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              3
            </span>
            <label htmlFor="comment-input" className="font-medium">{t("oneComment")}</label>
          </div>
          <textarea
            id="comment-input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder={t("commentPlaceholder")}
            className="w-full rounded-lg border border-input-border px-3 py-2 text-sm placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <p className="mt-1 text-xs text-text-muted">
            {comment.length}/200 {t("hashtagNote")}
          </p>
        </div>

        {/* Submit */}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        <button
          onClick={handleSubmit}
          disabled={!url || categories.length === 0 || submitting}
          className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-lg transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? t("submitting") : t("submitButton")}
        </button>
      </div>
    </div>
  );
}
