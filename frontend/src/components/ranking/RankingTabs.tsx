"use client";

import { useT } from "@/hooks/useTranslation";

interface RankingTabsProps {
  activePeriod: string;
  onPeriodChange: (period: string) => void;
}

export function RankingTabs({ activePeriod, onPeriodChange }: RankingTabsProps) {
  const t = useT();

  const periods = [
    { value: "24h", label: t("period24h") },
    { value: "1w", label: t("period1w") },
    { value: "1m", label: t("period1m") },
    { value: "all", label: t("periodAll") },
  ];

  return (
    <div className="flex gap-2">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onPeriodChange(p.value)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activePeriod === p.value
              ? "bg-brand text-white"
              : "bg-chip-bg text-text-primary hover:bg-chip-hover"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
