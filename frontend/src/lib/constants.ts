export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const CATEGORIES = [
  { slug: "funny", nameJa: "おもしろ", icon: "😂" },
  { slug: "cats-animals", nameJa: "猫・動物", icon: "🐱" },
  { slug: "sports", nameJa: "スポーツ", icon: "⚽" },
  { slug: "cooking", nameJa: "料理", icon: "🍳" },
  { slug: "heartwarming", nameJa: "感動", icon: "✨" },
  { slug: "music", nameJa: "音楽", icon: "🎵" },
  { slug: "gaming", nameJa: "ゲーム", icon: "🎮" },
  { slug: "news", nameJa: "ニュース", icon: "📰" },
  { slug: "tech", nameJa: "テクノロジー", icon: "🤖" },
  { slug: "idol", nameJa: "アイドル", icon: "🎤" },
  { slug: "sexy", nameJa: "セクシー", icon: "♡" },
  { slug: "other", nameJa: "その他", icon: "🏷️" },
] as const;

export const PLATFORMS = [
  { value: "x", label: "𝕏", icon: "𝕏" },
  { value: "youtube", label: "YouTube", icon: "▶" },
  { value: "tiktok", label: "TikTok", icon: "♪" },
] as const;

export const PERIODS = [
  { value: "24h", label: "24時間" },
  { value: "1w", label: "1週間" },
  { value: "1m", label: "1ヶ月" },
  { value: "all", label: "全期間" },
] as const;
