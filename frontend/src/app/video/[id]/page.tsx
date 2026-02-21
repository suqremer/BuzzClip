import type { Metadata } from "next";
import { API_URL } from "@/lib/constants";
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
    return {
      title: `${video.title || "バズ動画"} - BuzzClip`,
      description: `BuzzClipで話題の動画をチェック`,
      openGraph: {
        title: `${video.title || "バズ動画"} - BuzzClip`,
        type: "article",
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
