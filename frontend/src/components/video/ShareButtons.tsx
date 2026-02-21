"use client";

interface ShareButtonsProps {
  videoId: string;
  title?: string;
}

export function ShareButtons({ videoId, title }: ShareButtonsProps) {
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/video/${videoId}`
    : `/video/${videoId}`;
  const text = title || "この動画がバズってる！";

  const shareX = () => {
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "width=550,height=420"
    );
  };

  const shareLine = () => {
    window.open(
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
      "_blank",
      "width=550,height=420"
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert("リンクをコピーしました");
    } catch {
      alert("コピーに失敗しました");
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={shareX}
        className="rounded-full bg-gray-100 p-1.5 text-xs text-gray-500 transition hover:bg-gray-200"
        title="Xでシェア"
      >
        𝕏
      </button>
      <button
        onClick={shareLine}
        className="rounded-full bg-gray-100 p-1.5 text-xs text-gray-500 transition hover:bg-green-100 hover:text-green-600"
        title="LINEでシェア"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 5.81 2 10.5c0 4.17 3.68 7.66 8.66 8.35.34.07.8.22.91.51.1.26.07.67.03.93l-.15.87c-.04.25-.2.99.87.54s5.78-3.41 7.89-5.83C22.08 13.77 22 12.18 22 10.5 22 5.81 17.52 2 12 2z" />
        </svg>
      </button>
      <button
        onClick={copyLink}
        className="rounded-full bg-gray-100 p-1.5 text-xs text-gray-500 transition hover:bg-gray-200"
        title="リンクをコピー"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </button>
    </div>
  );
}
