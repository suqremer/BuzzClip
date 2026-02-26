import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "エロ動画を投稿 - BuzzClip",
  description:
    "X(Twitter)でバズったセクシー動画のURLを貼るだけで投稿完了。みんなで作るエロ動画ランキングに参加しよう。",
};

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
