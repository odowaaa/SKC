"use client";

import Link from "next/link";
import Image from "next/image";
import { Fragment } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { clearCompare, listCompare } from "@/lib/api/interest";
import { formatPrice } from "@/lib/utils";
import type { PropertySummary } from "@/lib/types";

interface CompareEntry {
  id: string;
  property: PropertySummary & {
    amenities: { amenity: { id: string; name: string } }[];
  };
}

const SPEC_ROWS: { label: string; render: (p: CompareEntry["property"]) => React.ReactNode }[] = [
  { label: "Price", render: (p) => formatPrice(p.price, p.currency) },
  { label: "Type", render: (p) => p.type },
  { label: "Listing", render: (p) => p.listingType },
  { label: "Bedrooms", render: (p) => p.bedrooms ?? "—" },
  { label: "Bathrooms", render: (p) => p.bathrooms ?? "—" },
  { label: "Area", render: (p) => (p.areaSqm ? `${Math.round(Number(p.areaSqm))} m²` : "—") },
  { label: "City", render: (p) => p.city },
  { label: "Amenities", render: (p) => p.amenities.map((a) => a.amenity.name).join(", ") || "—" },
];

export default function ComparePage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<CompareEntry[]>({ queryKey: ["compare"], queryFn: listCompare });

  const removeMutation = useMutation({
    mutationFn: (propertyId: string) => apiClient.delete(`/compare/${propertyId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["compare"] }),
  });

  const clearMutation = useMutation({
    mutationFn: clearCompare,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["compare"] }),
  });

  return (
    <div className="container-page py-16">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Compare properties</h1>
        {data && data.length > 0 && (
          <Button variant="outline" onClick={() => clearMutation.mutate()}>
            Clear all
          </Button>
        )}
      </div>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {!isLoading && (!data || data.length === 0) && (
        <p className="text-muted-foreground">
          No properties selected yet. Use the compare icon on a listing card or property page to add one.
        </p>
      )}

      {data && data.length > 0 && (
        <div className="overflow-x-auto">
          <div className="grid min-w-[640px] gap-4" style={{ gridTemplateColumns: `160px repeat(${data.length}, 1fr)` }}>
            <div />
            {data.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="pt-6">
                  <button
                    onClick={() => removeMutation.mutate(entry.property.id)}
                    className="float-right text-muted-foreground hover:text-destructive"
                    aria-label="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="relative mb-2 aspect-video overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={entry.property.media?.[0]?.url ?? "https://placehold.co/400x300?text=AMODA"}
                      alt={entry.property.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Link href={`/properties/${entry.property.slug}`} className="line-clamp-2 text-sm font-semibold hover:underline">
                    {entry.property.title}
                  </Link>
                </CardContent>
              </Card>
            ))}

            {SPEC_ROWS.map((row) => (
              <Fragment key={row.label}>
                <div className="flex items-center px-2 text-sm font-medium text-muted-foreground">{row.label}</div>
                {data.map((entry) => (
                  <div key={`${row.label}-${entry.id}`} className="flex items-center border-t border-border px-2 py-3 text-sm">
                    {row.render(entry.property)}
                  </div>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
