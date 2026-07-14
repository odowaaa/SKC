"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { Category } from "@/lib/types";

const ICONS: Record<string, string> = {
  construction: "🧱",
  electrical: "💡",
  plumbing: "🔧",
  tools: "🛠️",
  furniture: "🛋️",
  "home-appliances": "🧺",
  electronics: "📺",
  phones: "📱",
  computers: "💻",
  fashion: "👕",
  shoes: "👟",
  kitchen: "🍳",
  food: "🍚",
  restaurant: "🍽️",
  medical: "💊",
  agriculture: "🌾",
  livestock: "🐐",
  "vehicle-parts": "🔩",
  motorcycles: "🏍️",
  cars: "🚗",
  "heavy-equipment": "🚜",
  "office-supplies": "🗂️",
  stationery: "✏️",
  "cleaning-materials": "🧽",
  "solar-equipment": "☀️",
  "water-systems": "🚰",
  "security-equipment": "🔒",
  "industrial-equipment": "⚙️",
  others: "🧭",
};

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const { locale } = useTranslation();

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/search?category=${c.slug}`}
          className="card flex flex-col items-center justify-center gap-2 p-4 text-center transition hover:shadow-md"
        >
          <span className="text-2xl">{ICONS[c.slug] ?? "🛒"}</span>
          <span className="text-xs font-medium text-slate-700">
            {locale === "so" ? c.nameSo : c.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
