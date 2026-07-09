import Image from "next/image";
import Link from "next/link";
import { BedDouble, Bath, MapPin, Ruler } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
import type { PropertySummary } from "@/lib/types";

export function PropertyCard({ property, className }: { property: PropertySummary; className?: string }) {
  const image = property.media?.[0]?.url ?? "https://placehold.co/800x600?text=AMODA";

  return (
    <Link href={`/properties/${property.slug}`}>
      <Card className={cn("group overflow-hidden transition-shadow hover:shadow-lg", className)}>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <Image
            src={image}
            alt={property.title}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex gap-2">
            {property.isFeatured && <Badge variant="accent">Featured</Badge>}
            {property.isLuxury && <Badge variant="default">Luxury</Badge>}
          </div>
          <Badge variant="success" className="absolute right-3 top-3">
            {property.listingType === "RENT" ? "For Rent" : property.listingType === "SALE" ? "For Sale" : "Commercial"}
          </Badge>
        </div>

        <div className="space-y-2 p-4">
          <p className="text-lg font-bold text-secondary">
            {formatPrice(property.price, property.currency)}
            {property.listingType === "RENT" && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
          </p>
          <h3 className="line-clamp-1 font-semibold">{property.title}</h3>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {property.district ? `${property.district}, ` : ""}
            {property.city}
          </p>

          <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
            {property.bedrooms !== undefined && property.bedrooms !== null && (
              <span className="flex items-center gap-1">
                <BedDouble className="h-4 w-4" /> {property.bedrooms}
              </span>
            )}
            {property.bathrooms !== undefined && property.bathrooms !== null && (
              <span className="flex items-center gap-1">
                <Bath className="h-4 w-4" /> {property.bathrooms}
              </span>
            )}
            {property.areaSqm && (
              <span className="flex items-center gap-1">
                <Ruler className="h-4 w-4" /> {Math.round(Number(property.areaSqm))} m²
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
