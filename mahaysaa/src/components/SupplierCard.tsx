"use client";

import Link from "next/link";
import type { SupplierSummary } from "@/lib/types";

export function SupplierCard({ supplier }: { supplier: SupplierSummary }) {
  return (
    <Link href={`/supplier/${supplier.id}`} className="card flex items-center gap-3 p-3 transition hover:shadow-md">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary-50 text-xl">
        🏬
      </div>
      <div className="min-w-0">
        <p className="line-clamp-1 text-sm font-semibold text-slate-800">{supplier.businessName}</p>
        <p className="text-xs text-slate-500">
          {supplier.city}
          {supplier.distanceKm != null ? ` · ${supplier.distanceKm.toFixed(1)} km` : ""}
        </p>
        <p className="text-xs text-accent-600">
          ⭐ {supplier.ratingAvg?.toFixed(1) ?? "0.0"}
          {supplier.ratingCount ? ` (${supplier.ratingCount})` : ""}
        </p>
      </div>
    </Link>
  );
}
