"use client";

import { useEffect, useRef, useCallback } from "react";

export function useInfiniteScroll(
  onLoadMore: () => void,
  { enabled = true, rootMargin = "200px" } = {},
) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && enabled) {
        onLoadMore();
      }
    },
    [onLoadMore, enabled],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleIntersect, { rootMargin });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect, rootMargin]);

  return sentinelRef;
}
