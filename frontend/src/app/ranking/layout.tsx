import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ランキング - BuzzClip",
  description: "X(Twitter)でバズってる動画ランキング。24時間・週間・月間でチェック。",
};

export default function RankingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
