"use client";

import { useState } from "react";

const PERIODS = [
  { value: "24h", label: "24時間" },
  { value: "7d", label: "7日間" },
  { value: "30d", label: "30日間" },
  { value: "all", label: "全期間" },
];

const COUNTS = [3, 5, 10];

export default function EmbedCodePage() {
  const [count, setCount] = useState(5);
  const [period, setPeriod] = useState("24h");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [copied, setCopied] = useState(false);

  const iframeSrc = `https://buzzclip.jp/embed/ranking?count=${count}&period=${period}&theme=${theme}`;
  const embedCode = `<iframe src="${iframeSrc}" width="400" height="${count * 48 + 100}" style="border:none;border-radius:12px;" loading="lazy"></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">埋め込みウィジェット</h1>
      <p className="mt-2 text-text-secondary">
        BuzzClip のランキングをブログやWebサイトに埋め込めます。
      </p>

      {/* Options */}
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {/* Count */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">表示件数</label>
          <div className="flex gap-2">
            {COUNTS.map((c) => (
              <button
                key={c}
                onClick={() => setCount(c)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  count === c
                    ? "bg-brand text-white"
                    : "bg-chip-bg text-text-primary hover:bg-chip-hover"
                }`}
              >
                {c}件
              </button>
            ))}
          </div>
        </div>

        {/* Period */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">期間</label>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  period === p.value
                    ? "bg-brand text-white"
                    : "bg-chip-bg text-text-primary hover:bg-chip-hover"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">テーマ</label>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme("light")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                theme === "light"
                  ? "bg-brand text-white"
                  : "bg-chip-bg text-text-primary hover:bg-chip-hover"
              }`}
            >
              ライト
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                theme === "dark"
                  ? "bg-brand text-white"
                  : "bg-chip-bg text-text-primary hover:bg-chip-hover"
              }`}
            >
              ダーク
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-bold">プレビュー</h2>
        <div className="flex justify-center rounded-lg border border-border-main bg-surface-secondary p-6">
          <iframe
            src={`/embed/ranking?count=${count}&period=${period}&theme=${theme}`}
            width={400}
            height={count * 48 + 100}
            style={{ border: "none", borderRadius: 12 }}
          />
        </div>
      </div>

      {/* Code */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-bold">埋め込みコード</h2>
        <div className="relative">
          <pre className="overflow-x-auto rounded-lg border border-border-main bg-surface-secondary p-4 text-sm text-text-primary">
            <code>{embedCode}</code>
          </pre>
          <button
            onClick={handleCopy}
            className="absolute right-3 top-3 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-hover"
          >
            {copied ? "コピー済み!" : "コピー"}
          </button>
        </div>
      </div>
    </div>
  );
}
