"use client";

import { CATEGORIES } from "@/lib/constants";
import { usePreferences } from "@/contexts/PreferencesContext";

interface CategoryFilterProps {
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  const { isCategoryHidden } = usePreferences();

  const visibleCategories = CATEGORIES.filter((cat) => !isCategoryHidden(cat.slug));

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button
        onClick={() => onCategoryChange(null)}
        className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
          activeCategory === null
            ? "bg-brand text-white"
            : "bg-chip-bg text-text-primary hover:bg-chip-hover"
        }`}
      >
        すべて
      </button>
      {visibleCategories.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onCategoryChange(cat.slug)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            activeCategory === cat.slug
              ? "bg-brand text-white"
              : "bg-chip-bg text-text-primary hover:bg-chip-hover"
          }`}
        >
          {cat.icon} {cat.nameJa}
        </button>
      ))}
    </div>
  );
}
