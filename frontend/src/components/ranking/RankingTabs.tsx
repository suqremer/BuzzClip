"use client";

import { PERIODS } from "@/lib/constants";

interface RankingTabsProps {
  activePeriod: string;
  onPeriodChange: (period: string) => void;
}

export function RankingTabs({ activePeriod, onPeriodChange }: RankingTabsProps) {
  return (
    <div className="flex gap-2">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onPeriodChange(p.value)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activePeriod === p.value
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
