"use client";

import { useState, useMemo } from "react";

const URL_PATTERNS = [
  { regex: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/, platform: "x" as const, icon: "𝕏" },
  { regex: /^https?:\/\/(www\.|m\.)?youtube\.com\/(watch|shorts)/, platform: "youtube" as const, icon: "▶" },
  { regex: /^https?:\/\/youtu\.be\/[A-Za-z0-9_-]+/, platform: "youtube" as const, icon: "▶" },
  { regex: /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/, platform: "tiktok" as const, icon: "♪" },
  { regex: /^https?:\/\/(vm|vt)\.tiktok\.com\/[A-Za-z0-9_-]+/, platform: "tiktok" as const, icon: "♪" },
];

interface UrlInputProps {
  onValidUrl: (url: string) => void;
}

export function UrlInput({ onValidUrl }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const detectedPlatform = useMemo(() => {
    const trimmed = url.trim();
    if (!trimmed) return null;
    for (const pattern of URL_PATTERNS) {
      if (pattern.regex.test(trimmed)) return pattern;
    }
    return null;
  }, [url]);

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("URLを入力してください");
      return;
    }
    if (!detectedPlatform) {
      setError("X, YouTube, TikTokの動画URLを入力してください");
      return;
    }
    setError("");
    onValidUrl(trimmed);
  };

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            placeholder="動画のURLを貼り付け（X, YouTube, TikTok）"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {detectedPlatform && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg" title={detectedPlatform.platform}>
              {detectedPlatform.icon}
            </span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          className="shrink-0 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          プレビュー
        </button>
      </div>
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
}
