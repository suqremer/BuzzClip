import type { MetadataRoute } from "next";
import { API_URL } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: "https://buzzclip.jp", lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    { url: "https://buzzclip.jp/ranking", lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: "https://buzzclip.jp/search", lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: "https://buzzclip.jp/submit", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const res = await fetch(`${API_URL}/api/sitemap`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const videoPages: MetadataRoute.Sitemap = data.urls.map((v: { id: string; created_at: string }) => ({
        url: `https://buzzclip.jp/video/${v.id}`,
        lastModified: new Date(v.created_at),
        changeFrequency: "daily" as const,
        priority: 0.7,
      }));
      return [...staticPages, ...videoPages];
    }
  } catch {
    // ignore
  }
  return staticPages;
}
