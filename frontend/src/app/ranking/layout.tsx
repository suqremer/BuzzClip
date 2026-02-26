import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "エロ動画ランキング - BuzzClip | Xでバズったセクシー動画まとめ",
  description:
    "X(Twitter)でバズったエロ動画・セクシー動画をランキングで毎日更新。24時間・週間・月間の人気動画を素人・コスプレ・グラビア・ダンスなどカテゴリ別にチェック。",
  openGraph: {
    title: "エロ動画ランキング - BuzzClip",
    description:
      "Xでバズったセクシー動画をみんなで集めてランキング化。カテゴリ別に毎日更新。",
  },
};

export default function RankingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
