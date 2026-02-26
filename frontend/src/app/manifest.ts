import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BuzzClip - セクシー動画ランキング",
    short_name: "BuzzClip",
    start_url: "/ranking",
    display: "standalone",
    background_color: "#0f0f23",
    theme_color: "#6366f1",
  };
}
