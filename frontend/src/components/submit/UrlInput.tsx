"use client";

import { useState } from "react";

const TWEET_URL_REGEX = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/;

interface UrlInputProps {
  onValidUrl: (url: string) => void;
}

export function UrlInput({ onValidUrl }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("URLを入力してください");
      return;
    }
    if (!TWEET_URL_REGEX.test(trimmed)) {
      setError("有効なX(Twitter)のURLを入力してください");
      return;
    }
    setError("");
    onValidUrl(trimmed);
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError("");
          }}
          placeholder="https://x.com/user/status/123456..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
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
