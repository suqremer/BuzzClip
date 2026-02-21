import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "検索 - BuzzClip",
  description: "動画タイトルや投稿者名でバズ動画を検索",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
