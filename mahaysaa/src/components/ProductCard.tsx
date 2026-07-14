"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const { t, locale } = useTranslation();
  const displayName = (locale === "so" && product.nameSo) || product.name;
  const finalPrice =
    product.discountPct > 0
      ? Math.round(product.price * (1 - product.discountPct / 100) * 100) / 100
      : product.price;

  return (
    <Link href={`/product/${product.id}`} className="card group overflow-hidden transition hover:shadow-md">
      <div className="flex h-36 items-center justify-center bg-slate-100 text-4xl">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <span>📦</span>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="line-clamp-1 text-sm font-semibold text-slate-800">{displayName}</p>
        <p className="text-xs text-slate-500">{product.supplier.businessName}</p>
        <div className="flex items-center gap-2 pt-1">
          <span className="font-bold text-primary">
            {t("common.currency")}
            {finalPrice.toFixed(2)}
          </span>
          {product.discountPct > 0 && (
            <span className="text-xs text-slate-400 line-through">
              {t("common.currency")}
              {product.price.toFixed(2)}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400">
          {product.stock > 0 ? t("product.stock") : t("product.outOfStock")}
        </p>
      </div>
    </Link>
  );
}
