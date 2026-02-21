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
}

export function VideoEmbed({ oembedHtml }: VideoEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const sanitizedHtml = useMemo(
    () =>
      DOMPurify.sanitize(oembedHtml, {
        ADD_TAGS: ["blockquote", "iframe"],
        ADD_ATTR: ["data-tweet-id", "data-width", "data-dnt", "allowfullscreen", "frameborder"],
      }),
    [oembedHtml],
  );

  useEffect(() => {
    const loadWidgets = () => {
      window.twttr?.widgets.load(containerRef.current);
    };

    if (window.twttr) {
      loadWidgets();
      return;
    }

    const existing = document.querySelector(
      'script[src="https://platform.twitter.com/widgets.js"]',
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", loadWidgets);
      const interval = setInterval(() => {
        if (window.twttr) {
          clearInterval(interval);
          loadWidgets();
        }
      }, 100);
      return () => {
        existing.removeEventListener("load", loadWidgets);
        clearInterval(interval);
      };
    }

    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.onload = loadWidgets;
    document.body.appendChild(script);
  }, [sanitizedHtml]);

  return (
    <div
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      className="mx-auto max-w-[550px]"
    />
  );
}
