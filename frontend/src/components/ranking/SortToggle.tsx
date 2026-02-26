"use client";

import { useT } from "@/hooks/useTranslation";

interface SortToggleProps {
  activeSort: "hot" | "new";
  onSortChange: (sort: "hot" | "new") => void;
}

export function SortToggle({ activeSort, onSortChange }: SortToggleProps) {
  const t = useT();

  const options = [
    { value: "hot" as const, label: t("sortHot"), icon: "🔥" },
    { value: "new" as const, label: t("sortNew"), icon: "🕐" },
  ];

  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSortChange(opt.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            activeSort === opt.value
              ? "bg-brand text-white"
              : "bg-chip-bg text-text-primary hover:bg-chip-hover"
          }`}
        >
          {opt.icon} {opt.label}
        </button>
      ))}
    </div>
  );
}
