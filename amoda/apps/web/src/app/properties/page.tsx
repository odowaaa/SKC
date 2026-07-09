import Link from "next/link";
import type { Metadata } from "next";
import { PropertyCard } from "@/components/properties/property-card";
import { PropertyFilters } from "@/components/properties/property-filters";
import { Button } from "@/components/ui/button";
import { searchProperties } from "@/lib/api/properties";

export const metadata: Metadata = {
  title: "Properties for sale and rent",
  description: "Browse verified apartments, villas, land, and commercial properties across Somalia.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);

  const result = await searchProperties({
    q: params.q,
    city: params.city,
    country: params.country,
    type: params.type,
    listingType: params.listingType,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    minBedrooms: params.minBedrooms ? Number(params.minBedrooms) : undefined,
    sortBy: params.sortBy,
    featured: params.featured === "true" ? true : undefined,
    page,
    limit: 12,
  }).catch(() => ({ data: [], meta: { page: 1, limit: 12, total: 0, totalPages: 1 } }));

  const buildPageHref = (targetPage: number) => {
    const next = new URLSearchParams(params as Record<string, string>);
    next.set("page", String(targetPage));
    return `/properties?${next.toString()}`;
  };

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Properties</h1>
        <p className="mt-1 text-muted-foreground">{result.meta.total} listings found</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <PropertyFilters />

        <div>
          {result.data.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
              No properties match your filters. Try broadening your search.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {result.data.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}

          {result.meta.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {Array.from({ length: result.meta.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <Link key={pageNumber} href={buildPageHref(pageNumber)}>
                  <Button variant={pageNumber === page ? "primary" : "outline"} size="sm">
                    {pageNumber}
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
