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
  oembedHtml: string | null;
  platform?: "x" | "youtube" | "tiktok";
  url?: string;
  externalId?: string;
}

const ALLOWED_IFRAME_HOSTS = [
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "www.tiktok.com",
];

const SANITIZE_CONFIG = {
  ADD_TAGS: ["blockquote", "iframe"],
  ADD_ATTR: [
    "data-tweet-id", "data-width", "data-dnt",
    "allowfullscreen", "frameborder",
    "src", "allow", "class", "cite", "data-video-id",
    "width", "height", "title", "sandbox",
  ],
};

function sanitizeOembed(html: string): string {
  // Hook: validate iframe src and add sandbox
  DOMPurify.addHook("uponSanitizeElement", (node) => {
    const el = node as Element;
    if (el.tagName === "IFRAME") {
      const src = el.getAttribute("src") || "";
      try {
        const url = new URL(src);
        if (!ALLOWED_IFRAME_HOSTS.includes(url.hostname)) {
          el.remove();
          return;
        }
      } catch {
        el.remove();
        return;
      }
      // Sandbox: allow-scripts for embed functionality,
      // allow-popups-to-escape-sandbox for link navigation.
      // Deliberately omit allow-same-origin to prevent cookie access.
      el.setAttribute(
        "sandbox",
        "allow-scripts allow-popups-to-escape-sandbox"
      );
    }
  });
  const clean = DOMPurify.sanitize(html, SANITIZE_CONFIG);
  DOMPurify.removeAllHooks();
  return clean;
}

function buildFallbackEmbed(platform: string, url?: string, externalId?: string): string | null {
  if (!url && !externalId) return null;

  if (platform === "youtube" && externalId) {
    return `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${externalId}" frameborder="0" allowfullscreen title="YouTube video"></iframe>`;
  }

  if (platform === "x" && url) {
    return `<blockquote class="twitter-tweet" data-dnt="true"><a href="${url}"></a></blockquote>`;
  }

  if (platform === "tiktok" && url) {
    return `<blockquote class="tiktok-embed" cite="${url}" data-video-id="${externalId || ""}"><a href="${url}"></a></blockquote>`;
  }

  return null;
}

export function VideoEmbed({ oembedHtml, platform = "x", url, externalId }: VideoEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const sanitizedHtml = useMemo(() => {
    if (oembedHtml) return sanitizeOembed(oembedHtml);
    const fallback = buildFallbackEmbed(platform, url, externalId);
    return fallback || "";
  }, [oembedHtml, platform, url, externalId]);

  useEffect(() => {
    if (!sanitizedHtml) return;
    if (platform === "x") {
      loadTwitterWidgets(containerRef.current);
    } else if (platform === "tiktok") {
      loadTikTokEmbed();
    }
    // YouTube uses <iframe> — no script needed
  }, [sanitizedHtml, platform]);

  if (!sanitizedHtml) {
    // Final fallback: show link
    if (url) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg bg-surface-secondary p-4 text-center text-sm text-brand-text transition hover:bg-hover-bg"
        >
          元の動画を見る &rarr;
        </a>
      );
    }
    return null;
  }

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
