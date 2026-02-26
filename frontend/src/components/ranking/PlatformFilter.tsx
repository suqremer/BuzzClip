"use client";

import { PLATFORMS } from "@/lib/constants";
import { useT } from "@/hooks/useTranslation";

interface PlatformFilterProps {
  selectedPlatforms: string[];
  onPlatformsChange: (platforms: string[]) => void;
}

export function PlatformFilter({
  selectedPlatforms,
  onPlatformsChange,
}: PlatformFilterProps) {
  const isAll = selectedPlatforms.length === 0;
  const t = useT();

  const handleToggle = (value: string) => {
    if (selectedPlatforms.includes(value)) {
      const next = selectedPlatforms.filter((p) => p !== value);
      onPlatformsChange(next);
    } else {
      onPlatformsChange([...selectedPlatforms, value]);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => onPlatformsChange([])}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          isAll
            ? "bg-brand text-white"
            : "bg-chip-bg text-text-primary hover:bg-chip-hover"
        }`}
      >
        {t("allPlatforms")}
      </button>
      {PLATFORMS.map((p) => (
        <button
          key={p.value}
          onClick={() => handleToggle(p.value)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedPlatforms.includes(p.value)
              ? "bg-brand text-white"
              : "bg-chip-bg text-text-primary hover:bg-chip-hover"
          }`}
        >
          {p.icon} {p.label}
        </button>
      ))}
    </div>
  );
}
