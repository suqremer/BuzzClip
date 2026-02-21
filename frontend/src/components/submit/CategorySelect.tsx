"use client";

import { CATEGORIES } from "@/lib/constants";

interface CategorySelectProps {
  selected: string[];
  onChange: (slugs: string[]) => void;
}

export function CategorySelect({ selected, onChange }: CategorySelectProps) {
  const toggle = (slug: string) => {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else if (selected.length < 3) {
      onChange([...selected, slug]);
    }
  };

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-700">
        カテゴリを選択（最大3つ）
      </p>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => toggle(cat.slug)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              selected.includes(cat.slug)
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.icon} {cat.nameJa}
          </button>
        ))}
      </div>
    </div>
  );
}
