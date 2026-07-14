"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const { t } = useTranslation();
  const [q, setQ] = useState(initialQuery);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-2xl gap-2">
      <input
        className="input flex-1 bg-white"
        placeholder={t("home.searchPlaceholder")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <button type="submit" className="btn-primary shrink-0">
        {t("home.searchButton")}
      </button>
    </form>
  );
}
