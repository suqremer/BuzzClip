"use client";

import { CATEGORIES } from "@/lib/constants";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useT } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/lib/i18n";

interface CategoryFilterProps {
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  const { isCategoryHidden } = usePreferences();
  const t = useT();

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
        {t("allCategories")}
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
          {cat.icon} {t(cat.slug as TranslationKey)}
        </button>
      ))}
    </div>
  );
}
