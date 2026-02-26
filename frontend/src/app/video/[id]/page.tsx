import type { Metadata } from "next";
import { API_URL, SITE_URL } from "@/lib/constants";
import VideoDetail from "./VideoDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API_URL}/api/videos/${id}`, { cache: "no-store" });
    if (!res.ok) return { title: "BuzzClip" };
    const video = await res.json();
    const title = `${video.title || "セクシー動画"} - BuzzClip`;
    const description = video.author_name
      ? `${video.author_name}のセクシー動画をBuzzClipでチェック。エロ動画ランキング毎日更新中`
      : "BuzzClipで話題のエロ動画・セクシー動画をランキングでチェック";
    const url = `${SITE_URL}/video/${id}`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        url,
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
    };
  } catch {
    return { title: "BuzzClip" };
  }
}

export default async function VideoPage({ params }: Props) {
  const { id } = await params;
  return <VideoDetail id={id} />;
}
