// All API requests go through Next.js rewrites (same-origin proxy).
// This avoids cross-origin cookie issues on mobile Safari (ITP).
export const API_URL = "";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://buzzclip.jp";

export const CATEGORIES = [
  { slug: "sexy", nameJa: "セクシー", icon: "♡" },
  { slug: "amateur", nameJa: "素人", icon: "📱" },
  { slug: "cosplay", nameJa: "コスプレ", icon: "🎀" },
  { slug: "idol", nameJa: "アイドル", icon: "🎤" },
  { slug: "gravure", nameJa: "グラビア", icon: "📸" },
  { slug: "dance", nameJa: "ダンス", icon: "💃" },
  { slug: "funny", nameJa: "おもしろ", icon: "😂" },
  { slug: "cats-animals", nameJa: "猫・動物", icon: "🐱" },
  { slug: "sports", nameJa: "スポーツ", icon: "⚽" },
  { slug: "music", nameJa: "音楽", icon: "🎵" },
  { slug: "gaming", nameJa: "ゲーム", icon: "🎮" },
  { slug: "japanese", nameJa: "日本モノ", icon: "🇯🇵" },
  { slug: "western", nameJa: "海外モノ", icon: "🌍" },
  { slug: "other", nameJa: "その他", icon: "🏷️" },
] as const;

export const PLATFORMS = [
  { value: "x", label: "X", icon: "𝕏" },
  { value: "youtube", label: "YouTube", icon: "▶" },
  { value: "tiktok", label: "TikTok", icon: "♪" },
] as const;

export const PERIODS = [
  { value: "24h", label: "24時間" },
  { value: "1w", label: "1週間" },
  { value: "1m", label: "1ヶ月" },
  { value: "all", label: "全期間" },
] as const;
