"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdUnitProps {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  responsive?: boolean;
  className?: string;
}

const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID;

export function AdUnit({ slot, format = "auto", responsive = true, className = "" }: AdUnitProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADSENSE_ID || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not ready or blocked
    }
  }, []);

  if (!ADSENSE_ID) return null;

  return (
    <div className={`ad-container overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}

/** In-feed ad for between video cards */
export function InFeedAd({ slot, className = "" }: { slot: string; className?: string }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADSENSE_ID || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {}
  }, []);

  if (!ADSENSE_ID) return null;

  return (
    <div className={`ad-container overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_ID}
        data-ad-slot={slot}
        data-ad-format="fluid"
        data-ad-layout-key="-6t+ed+2i-1n-4w"
      />
    </div>
  );
}
