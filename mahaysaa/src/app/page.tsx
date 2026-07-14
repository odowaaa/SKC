"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { SearchBar } from "@/components/SearchBar";
import { CategoryGrid } from "@/components/CategoryGrid";
import { ProductCard } from "@/components/ProductCard";
import { SupplierCard } from "@/components/SupplierCard";
import type { Category, Product, SupplierSummary } from "@/lib/types";

export default function HomePage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts((d.products ?? []).slice(0, 8)));
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((d) => setSuppliers((d.suppliers ?? []).slice(0, 6)));
  }, []);

  return (
    <div>
      <section className="bg-gradient-to-br from-primary to-primary-700 px-4 py-14 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
          <h1 className="text-3xl font-extrabold sm:text-4xl">{t("app.name")}</h1>
          <p className="max-w-xl text-primary-50/90 text-white/90">{t("app.tagline")}</p>
          <SearchBar />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{t("home.categories")}</h2>
        </div>
        <CategoryGrid categories={categories} />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{t("home.featuredSuppliers")}</h2>
          <Link href="/search" className="text-sm font-medium text-primary">
            {t("home.viewAll")}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <SupplierCard key={s.id} supplier={s} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 pb-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{t("home.featuredProducts")}</h2>
          <Link href="/search" className="text-sm font-medium text-primary">
            {t("home.viewAll")}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
