"use client";

import { useQuery } from "@tanstack/react-query";
import { PropertyCard } from "@/components/properties/property-card";
import { listFavorites } from "@/lib/api/properties";
import type { PropertySummary } from "@/lib/types";

interface FavoriteEntry {
  id: string;
  property: PropertySummary;
}

export default function DashboardFavoritesPage() {
  const { data, isLoading } = useQuery<FavoriteEntry[]>({
    queryKey: ["favorites"],
    queryFn: listFavorites,
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Saved properties</h1>
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {!isLoading && data?.length === 0 && (
        <p className="text-muted-foreground">You haven&apos;t saved any properties yet.</p>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((entry) => <PropertyCard key={entry.id} property={entry.property} />)}
      </div>
    </div>
  );
}
