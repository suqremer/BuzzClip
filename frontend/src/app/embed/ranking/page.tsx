"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface EmbedVideo {
  id: string;
  title: string | null;
  url: string;
  platform: string;
  vote_count: number;
  categories: { slug: string; name_ja: string; icon: string | null }[];
}

const PLATFORM_ICONS: Record<string, string> = {
  x: "𝕏",
  youtube: "▶",
  tiktok: "♪",
};

function EmbedRankingContent() {
  const searchParams = useSearchParams();
  const count = Math.min(Number(searchParams.get("count") || "5"), 10);
  const period = searchParams.get("period") || "24h";
  const category = searchParams.get("category");
  const theme = searchParams.get("theme") || "light";

  const [videos, setVideos] = useState<EmbedVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({
      page: "1",
      per_page: String(count),
      period,
    });
    if (category) params.set("category", category);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${apiBase}/api/rankings?${params}`)
      .then((r) => r.json())
      .then((data) => setVideos(data.items?.slice(0, count) || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [count, period, category]);

  const isDark = theme === "dark";

  return (
    <div
      style={{
        fontFamily: "'Noto Sans JP', sans-serif",
        maxWidth: 400,
        margin: "0 auto",
        padding: 16,
        backgroundColor: isDark ? "#1a1a2e" : "#ffffff",
        color: isDark ? "#e0e0e0" : "#1a1a1a",
        borderRadius: 12,
        border: `1px solid ${isDark ? "#2a2a4a" : "#e5e7eb"}`,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>BuzzClip</span>
          <span style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 9999,
            backgroundColor: isDark ? "#312e81" : "#eef2ff",
            color: isDark ? "#a5b4fc" : "#4f46e5",
            fontWeight: 600,
          }}>
            TOP {count}
          </span>
        </div>
        <a
          href="https://buzzclip.jp/ranking"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 11,
            color: isDark ? "#818cf8" : "#6366f1",
            textDecoration: "none",
          }}
        >
          もっと見る &rarr;
        </a>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: isDark ? "#666" : "#999" }}>
          読み込み中...
        </div>
      ) : videos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: isDark ? "#666" : "#999" }}>
          データがありません
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {videos.map((video, i) => (
            <a
              key={video.id}
              href={`https://buzzclip.jp/video/${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 8,
                textDecoration: "none",
                color: "inherit",
                backgroundColor: isDark ? "#1e1e3a" : "#fafafa",
                border: `1px solid ${isDark ? "#2a2a4a" : "#f0f0f0"}`,
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? "#252550" : "#f0f0ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? "#1e1e3a" : "#fafafa";
              }}
            >
              {/* Rank */}
              <span style={{
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0,
                backgroundColor: i === 0
                  ? "#f59e0b"
                  : i === 1
                    ? "#9ca3af"
                    : i === 2
                      ? "#b45309"
                      : isDark ? "#374151" : "#e5e7eb",
                color: i < 3 ? "#fff" : isDark ? "#d1d5db" : "#374151",
              }}>
                {i + 1}
              </span>

              {/* Platform icon */}
              <span style={{ fontSize: 16, flexShrink: 0 }}>
                {PLATFORM_ICONS[video.platform] || "🔗"}
              </span>

              {/* Title */}
              <span style={{
                flex: 1,
                fontSize: 13,
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap" as const,
              }}>
                {video.title || "動画を見る"}
              </span>

              {/* Votes */}
              <span style={{
                fontSize: 12,
                color: isDark ? "#818cf8" : "#6366f1",
                fontWeight: 600,
                flexShrink: 0,
              }}>
                ♥ {video.vote_count}
              </span>
            </a>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 10,
        textAlign: "center" as const,
        fontSize: 10,
        color: isDark ? "#555" : "#aaa",
      }}>
        <a
          href="https://buzzclip.jp"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "inherit", textDecoration: "none" }}
        >
          Powered by BuzzClip
        </a>
      </div>
    </div>
  );
}

export default function EmbedRankingPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: "center", padding: 40, color: "#999" }}>読み込み中...</div>
    }>
      <EmbedRankingContent />
    </Suspense>
  );
}
