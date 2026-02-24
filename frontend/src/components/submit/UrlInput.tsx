"use client";

import { useState, useMemo, useEffect, useCallback } from "react";

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
  const stableOnValidUrl = useCallback(onValidUrl, [onValidUrl]);

  const detectedPlatform = useMemo(() => {
    const trimmed = url.trim();
    if (!trimmed) return null;
    for (const pattern of URL_PATTERNS) {
      if (pattern.regex.test(trimmed)) return pattern;
    }
    return null;
  }, [url]);

  // Auto-validate: notify parent as soon as a valid URL is detected
  useEffect(() => {
    if (detectedPlatform) {
      stableOnValidUrl(url.trim());
    }
  }, [detectedPlatform, url, stableOnValidUrl]);

  return (
    <div>
      <div className="relative">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="動画のURLを貼り付け（X, YouTube, TikTok）"
          className="w-full rounded-lg border border-input-border px-4 py-2.5 pr-10 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        {detectedPlatform && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg" title={detectedPlatform.platform}>
            {detectedPlatform.icon}
          </span>
        )}
      </div>
      {url.trim() && !detectedPlatform && (
        <p className="mt-1.5 text-sm text-red-500">X, YouTube, TikTokの動画URLを入力してください</p>
      )}
    </div>
  );
}
