"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { SearchBar } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import type { Category, Product } from "@/lib/types";

function SearchContent() {
  const { t, locale } = useTranslation();
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const sort = params.get("sort") ?? "newest";

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = new URL("/api/search", window.location.origin);
    if (q) url.searchParams.set("q", q);
    if (category) url.searchParams.set("category", category);
    if (sort) url.searchParams.set("sort", sort);
    fetch(url.toString())
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .finally(() => setLoading(false));
  }, [q, category, sort]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/search?${next.toString()}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <SearchBar initialQuery={q} />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          className="input w-auto bg-white"
          value={category}
          onChange={(e) => updateParam("category", e.target.value)}
        >
          <option value="">{t("home.categories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {locale === "so" ? c.nameSo : c.name}
            </option>
          ))}
        </select>

        <select
          className="input w-auto bg-white"
          value={sort}
          onChange={(e) => updateParam("sort", e.target.value)}
        >
          <option value="newest">{locale === "so" ? "Ugu dambeeya" : "Newest"}</option>
          <option value="price_low_high">{locale === "so" ? "Qiimo: Hoos-Sare" : "Price: Low to High"}</option>
          <option value="price_high_low">{locale === "so" ? "Qiimo: Sare-Hoos" : "Price: High to Low"}</option>
        </select>
      </div>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-slate-500">{t("common.loading")}</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-slate-500">
            {locale === "so" ? "Wax natiijo ah lama helin." : "No results found."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
