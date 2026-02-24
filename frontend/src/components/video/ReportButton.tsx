"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const REASONS = [
  { value: "spam", label: "スパム" },
  { value: "inappropriate", label: "不適切なコンテンツ" },
  { value: "copyright", label: "著作権侵害" },
  { value: "misleading", label: "誤解を招く内容" },
  { value: "other", label: "その他" },
] as const;

interface ReportButtonProps {
  videoId: string;
}

export function ReportButton({ videoId }: ReportButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    if (!reason) return;
    setLoading(true);
    setError("");
    try {
      await apiPost("/api/reports", {
        video_id: videoId,
        reason,
        detail: detail.trim() || null,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "通報に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <p className="text-sm text-text-secondary">通報を受け付けました。ご協力ありがとうございます。</p>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-text-muted transition hover:text-red-500"
      >
        通報する
      </button>

      {open && (
        <div className="mt-3 rounded-lg border border-border-main bg-surface-secondary p-4">
          <p className="mb-3 text-sm font-medium text-text-primary">通報理由</p>
          <div className="mb-3 space-y-2">
            {REASONS.map((r) => (
              <label key={r.value} className="flex items-center gap-2 text-sm text-text-primary">
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={(e) => setReason(e.target.value)}
                  className="accent-indigo-600"
                />
                {r.label}
              </label>
            ))}
          </div>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="詳細（任意、500文字以内）"
            maxLength={500}
            rows={2}
            className="mb-3 w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
          {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!reason || loading}
              className="rounded-lg bg-red-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? "送信中..." : "通報する"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-input-border px-4 py-1.5 text-sm text-text-primary transition hover:bg-hover-bg"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
