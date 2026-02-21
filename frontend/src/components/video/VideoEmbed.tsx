"use client";

import DOMPurify from "dompurify";
import { useEffect, useMemo, useRef } from "react";

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (el?: HTMLElement | null) => void;
      };
    };
  }
}

interface VideoEmbedProps {
  oembedHtml: string;
  platform?: "x" | "youtube" | "tiktok";
}

const SANITIZE_CONFIG = {
  ADD_TAGS: ["blockquote", "iframe"],
  ADD_ATTR: [
    "data-tweet-id", "data-width", "data-dnt",
    "allowfullscreen", "frameborder",
    "src", "allow", "class", "cite", "data-video-id",
    "width", "height", "title",
  ],
};

export function VideoEmbed({ oembedHtml, platform = "x" }: VideoEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const sanitizedHtml = useMemo(
    () => DOMPurify.sanitize(oembedHtml, SANITIZE_CONFIG),
    [oembedHtml],
  );

  useEffect(() => {
    if (platform === "x") {
      loadTwitterWidgets(containerRef.current);
    } else if (platform === "tiktok") {
      loadTikTokEmbed();
    }
    // YouTube uses <iframe> — no script needed
  }, [sanitizedHtml, platform]);

  return (
    <div
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      className="mx-auto max-w-[550px]"
    />
  );
}

function loadTwitterWidgets(container: HTMLElement | null) {
  const loadWidgets = () => {
    window.twttr?.widgets.load(container);
  };

  if (window.twttr) {
    loadWidgets();
    return;
  }

  const existing = document.querySelector(
    'script[src="https://platform.twitter.com/widgets.js"]',
  ) as HTMLScriptElement | null;

  if (existing) {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.twttr) {
        clearInterval(interval);
        loadWidgets();
      } else if (attempts >= 50) {
        clearInterval(interval);
      }
    }, 100);
    return;
  }

  const script = document.createElement("script");
  script.src = "https://platform.twitter.com/widgets.js";
  script.async = true;
  script.onload = loadWidgets;
  document.body.appendChild(script);
}

function loadTikTokEmbed() {
  const scriptSrc = "https://www.tiktok.com/embed.js";
  if (document.querySelector(`script[src="${scriptSrc}"]`)) {
    return;
  }
  const script = document.createElement("script");
  script.src = scriptSrc;
  script.async = true;
  document.body.appendChild(script);
}
