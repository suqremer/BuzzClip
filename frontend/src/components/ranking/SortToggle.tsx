"use client";

import { useT } from "@/hooks/useTranslation";

interface SortToggleProps {
  activeSort: "hot" | "new";
  onSortChange: (sort: "hot" | "new") => void;
}

export function SortToggle({ activeSort, onSortChange }: SortToggleProps) {
  const t = useT();

  return (
    <select
      value={activeSort}
      onChange={(e) => onSortChange(e.target.value as "hot" | "new")}
      className="rounded-lg border border-input-border bg-surface px-2 py-1 text-sm font-medium text-text-primary transition hover:bg-hover-bg focus:outline-none focus:ring-2 focus:ring-brand/40"
    >
      <option value="hot">🔥 {t("sortHot")}</option>
      <option value="new">🕐 {t("sortNew")}</option>
    </select>
  );
}
