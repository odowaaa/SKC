import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bath, BedDouble, MapPin, Ruler, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PropertyCard } from "@/components/properties/property-card";
import { FavoriteButton } from "@/components/properties/favorite-button";
import { BookingForm } from "@/components/properties/booking-form";
import { getPropertyBySlug, getSimilarProperties } from "@/lib/api/properties";
import { formatPrice } from "@/lib/utils";

const AMENITY_FLAGS: { key: keyof Awaited<ReturnType<typeof getPropertyBySlug>>; label: string }[] = [
  { key: "hasSwimmingPool", label: "Swimming Pool" },
  { key: "hasGarden", label: "Garden" },
  { key: "petsAllowed", label: "Pets Allowed" },
  { key: "hasAirConditioning", label: "Air Conditioning" },
  { key: "hasGym", label: "Gym" },
  { key: "hasSecurity", label: "24/7 Security" },
  { key: "hasWater", label: "Water Supply" },
  { key: "hasElectricity", label: "Electricity" },
];

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const property = await getPropertyBySlug(slug);
    return {
      title: property.title,
      description: property.description.slice(0, 160),
      openGraph: { images: property.media?.[0]?.url ? [property.media[0].url] : [] },
    };
  } catch {
    return { title: "Property not found" };
  }
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let property;
  try {
    property = await getPropertyBySlug(slug);
  } catch {
    notFound();
  }

  const similar = await getSimilarProperties(property.id).catch(() => []);
  const images = property.media.length > 0 ? property.media : [{ id: "placeholder", kind: "IMAGE", url: "https://placehold.co/1200x800?text=AMODA" }];

  return (
    <div className="container-page py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {property.isFeatured && <Badge variant="accent">Featured</Badge>}
            {property.isLuxury && <Badge>Luxury</Badge>}
            <Badge variant="success">{property.listingType}</Badge>
            <span className="text-xs text-muted-foreground">Ref: {property.referenceCode}</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="relative col-span-4 aspect-[16/9] overflow-hidden rounded-xl bg-muted md:col-span-3">
              <Image src={images[0].url} alt={property.title} fill className="object-cover" priority />
            </div>
            <div className="col-span-4 grid grid-cols-4 gap-2 md:col-span-1 md:grid-cols-1">
              {images.slice(1, 4).map((image) => (
                <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                  <Image src={image.url} alt={property.title} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{property.title}</h1>
              <p className="mt-1 flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {[property.neighborhood, property.district, property.city, property.country].filter(Boolean).join(", ")}
              </p>
            </div>
            <FavoriteButton propertyId={property.id} />
          </div>

          <div className="mt-4 flex flex-wrap gap-6 border-y border-border py-4 text-sm">
            {property.bedrooms !== null && property.bedrooms !== undefined && (
              <span className="flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-secondary" /> {property.bedrooms} Bedrooms
              </span>
            )}
            {property.bathrooms !== null && property.bathrooms !== undefined && (
              <span className="flex items-center gap-2">
                <Bath className="h-5 w-5 text-secondary" /> {property.bathrooms} Bathrooms
              </span>
            )}
            {property.areaSqm && (
              <span className="flex items-center gap-2">
                <Ruler className="h-5 w-5 text-secondary" /> {Math.round(Number(property.areaSqm))} m²
              </span>
            )}
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold">Description</h2>
            <p className="mt-2 whitespace-pre-line text-muted-foreground">{property.description}</p>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold">Amenities</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {AMENITY_FLAGS.filter((flag) => property[flag.key]).map((flag) => (
                <span key={String(flag.key)} className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-success" /> {flag.label}
                </span>
              ))}
              {property.amenities.map(({ amenity }) => (
                <span key={amenity.id} className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-success" /> {amenity.name}
                </span>
              ))}
            </div>
          </div>

          {similar.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-semibold">Similar properties</h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map((item) => (
                  <PropertyCard key={item.id} property={item} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-secondary">
                {formatPrice(property.price, property.currency)}
                {property.listingType === "RENT" && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
              </p>

              {property.agent && (
                <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {property.agent.user.firstName[0]}
                    {property.agent.user.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {property.agent.user.firstName} {property.agent.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{property.agent.agencyName ?? "AMODA Agent"}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-3 font-semibold">Schedule a viewing</h3>
              <BookingForm propertyId={property.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
