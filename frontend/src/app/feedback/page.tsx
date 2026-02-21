"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";

const CATEGORIES = [
  { value: "bug", label: "バグ報告" },
  { value: "feature", label: "機能リクエスト" },
  { value: "improvement", label: "改善提案" },
  { value: "other", label: "その他" },
];

export default function FeedbackPage() {
  const [category, setCategory] = useState("feature");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      setError("内容を入力してください");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiPost("/api/feedback", { category, body: body.trim() });
      setSubmitted(true);
    } catch {
      setError("送信に失敗しました。しばらくしてからお試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-bold">ありがとうございます！</h1>
        <p className="mt-2 text-gray-500">
          フィードバックを受け付けました。今後の改善に活用させていただきます。
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setBody("");
          }}
          className="mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          もう一件送る
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold">フィードバック</h1>
      <p className="mt-2 text-sm text-gray-500">
        BuzzClipの改善にご協力ください。バグ報告や機能リクエストなど、なんでもお気軽にどうぞ。
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">カテゴリ</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  category === cat.value
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="body" className="mb-1 block text-sm font-medium text-gray-700">
            内容
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="詳しく教えてください..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{body.length}/2000</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "送信中..." : "送信する"}
        </button>
      </form>
    </div>
  );
}
