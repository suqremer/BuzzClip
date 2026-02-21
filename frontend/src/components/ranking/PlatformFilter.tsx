"use client";

import { PLATFORMS } from "@/lib/constants";

interface PlatformFilterProps {
  selectedPlatforms: string[];
  onPlatformsChange: (platforms: string[]) => void;
}

export function PlatformFilter({
  selectedPlatforms,
  onPlatformsChange,
}: PlatformFilterProps) {
  const isAll = selectedPlatforms.length === 0;

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
            ? "bg-indigo-600 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        すべて
      </button>
      {PLATFORMS.map((p) => (
        <button
          key={p.value}
          onClick={() => handleToggle(p.value)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedPlatforms.includes(p.value)
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {p.icon} {p.label}
        </button>
      ))}
    </div>
  );
}
