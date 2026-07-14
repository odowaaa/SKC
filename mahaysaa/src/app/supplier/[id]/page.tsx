"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

interface SupplierDetail {
  id: string;
  businessName: string;
  ownerName: string;
  city: string;
  whatsapp?: string | null;
  description?: string | null;
  ratingAvg: number;
  ratingCount: number;
  workingHours?: string | null;
  products: Product[];
  reviews: { id: string; rating: number; comment?: string | null; user: { name: string } }[];
}

export default function SupplierPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useTranslation();
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);

  useEffect(() => {
    fetch(`/api/suppliers/${id}`)
      .then((r) => r.json())
      .then((d) => setSupplier(d.supplier));
  }, [id]);

  if (!supplier) return <div className="p-8 text-sm text-slate-500">{t("common.loading")}</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{supplier.businessName}</h1>
            <p className="text-sm text-slate-500">{supplier.city}</p>
            <p className="mt-1 text-sm text-accent-600">
              ⭐ {supplier.ratingAvg.toFixed(1)} ({supplier.ratingCount})
            </p>
          </div>
          {supplier.whatsapp && (
            <a
              href={`https://wa.me/${supplier.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
            >
              WhatsApp
            </a>
          )}
        </div>
        {supplier.description && <p className="mt-4 text-sm text-slate-700">{supplier.description}</p>}
        {supplier.workingHours && (
          <p className="mt-2 text-xs text-slate-500">
            {locale === "so" ? "Saacadaha Shaqada" : "Working Hours"}: {supplier.workingHours}
          </p>
        )}
      </div>

      <h2 className="mb-4 mt-8 text-lg font-bold text-slate-800">{t("dashboard.supplier.products")}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {supplier.products.map((p) => (
          <ProductCard key={p.id} product={{ ...p, supplier }} />
        ))}
      </div>

      {supplier.reviews.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-slate-800">
            {locale === "so" ? "Faallooyinka" : "Reviews"}
          </h2>
          <div className="space-y-3">
            {supplier.reviews.map((r) => (
              <div key={r.id} className="card p-3">
                <p className="text-sm font-semibold">
                  {r.user.name} &middot; {"⭐".repeat(r.rating)}
                </p>
                {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
