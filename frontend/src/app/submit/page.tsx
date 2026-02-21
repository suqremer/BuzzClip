"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { UrlInput } from "@/components/submit/UrlInput";
import { CategorySelect } from "@/components/submit/CategorySelect";

interface SubmitResponse {
  id: string;
}

export default function SubmitPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [url, setUrl] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (authLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" role="status" aria-label="読み込み中" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-800">ログインが必要です</h1>
        <p className="mt-3 text-gray-500">
          動画を投稿するにはログインしてください。
        </p>
        <Link
          href="/auth/signin"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
        >
          ログインする
        </Link>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!url) return;
    if (categories.length === 0) {
      setError("カテゴリを1つ以上選択してください");
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
        e instanceof Error ? e.message : "投稿に失敗しました"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">動画を投稿</h1>
      <p className="mb-8 text-sm text-gray-500">
        X, YouTube, TikTokの動画URLを貼り付けて、カテゴリを選んで投稿しよう。
      </p>

      <div className="space-y-6">
        {/* Step 1: URL */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              1
            </span>
            <span className="font-medium">動画URLを入力</span>
          </div>
          <UrlInput onValidUrl={setUrl} />
          {url && (
            <p className="mt-2 text-sm text-green-600">
              URL確認済み
            </p>
          )}
        </div>

        {/* Step 2: Category */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              2
            </span>
            <span className="font-medium">カテゴリを選択</span>
          </div>
          <CategorySelect selected={categories} onChange={setCategories} />
        </div>

        {/* Step 3: Comment */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              3
            </span>
            <span className="font-medium">ひとこと（任意）</span>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="おすすめポイントなど #タグ も使えます"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            {comment.length}/200　#を付けるとタグになります（最大5つ）
          </p>
        </div>

        {/* Submit */}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        <button
          onClick={handleSubmit}
          disabled={!url || categories.length === 0 || submitting}
          className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "投稿中..." : "投稿する"}
        </button>
      </div>
    </div>
  );
}
