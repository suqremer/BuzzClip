import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "動画を投稿 - BuzzClip",
  description: "X(Twitter)のバズ動画URLを投稿してランキングに参加しよう。",
};

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
