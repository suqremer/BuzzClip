"use client";

interface SortToggleProps {
  activeSort: "hot" | "new";
  onSortChange: (sort: "hot" | "new") => void;
}

const SORT_OPTIONS = [
  { value: "hot" as const, label: "人気順", icon: "🔥" },
  { value: "new" as const, label: "新着順", icon: "🕐" },
];

export function SortToggle({ activeSort, onSortChange }: SortToggleProps) {
  return (
    <div className="flex gap-1.5">
      {SORT_OPTIONS.map((opt) => (
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
