import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "エロ動画検索 - BuzzClip",
  description:
    "タイトル・投稿者名・タグでセクシー動画を検索。お気に入りのエロ動画を見つけよう。",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
