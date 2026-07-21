"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createPropertySchema, type CreatePropertyInput } from "@amoda/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { createProperty, updateProperty, uploadFile } from "@/lib/api/properties";
import type { PropertyDetail } from "@/lib/types";

const PROPERTY_TYPES = [
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "TOWNHOUSE",
  "DUPLEX",
  "STUDIO",
  "PENTHOUSE",
  "LAND",
  "OFFICE",
  "WAREHOUSE",
  "SHOP",
  "RETAIL",
  "HOTEL",
  "BUILDING",
];

const LISTING_TYPES = ["SALE", "RENT", "COMMERCIAL"];

interface Amenity {
  id: string;
  name: string;
}

export function PropertyForm({ property }: { property?: PropertyDetail }) {
  const router = useRouter();
  const isEdit = Boolean(property);
  const [images, setImages] = useState<string[]>(property?.media.map((m) => m.url) ?? []);
  const [uploading, setUploading] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    property?.amenities.map((a) => a.amenity.id) ?? [],
  );

  const { data: amenities } = useQuery<Amenity[]>({
    queryKey: ["amenities"],
    queryFn: async () => (await apiClient.get("/amenities")).data.data,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePropertyInput>({
    resolver: zodResolver(createPropertySchema),
    defaultValues: property
      ? {
          title: property.title,
          description: property.description,
          type: property.type as CreatePropertyInput["type"],
          listingType: property.listingType as CreatePropertyInput["listingType"],
          price: Number(property.price),
          currency: property.currency,
          bedrooms: property.bedrooms ?? undefined,
          bathrooms: property.bathrooms ?? undefined,
          areaSqm: property.areaSqm ? Number(property.areaSqm) : undefined,
          country: property.country,
          city: property.city,
          district: property.district ?? undefined,
        }
      : { currency: "USD" },
  });

  const mutation = useMutation({
    mutationFn: async (values: CreatePropertyInput) => {
      const payload = { ...values, amenityIds: selectedAmenities };
      const result = isEdit ? await updateProperty(property!.id, payload) : await createProperty(payload);

      if (images.length > 0) {
        await apiClient.post(`/properties/${result.id}/media`, {
          media: images.map((url) => ({ url, kind: "IMAGE" })),
        }).catch(() => undefined);
      }

      return result;
    },
    onSuccess: () => router.push("/dashboard/properties"),
  });

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadFile(file);
      setImages((prev) => [...prev, result.url]);
    } catch {
      // upload failures are surfaced via the disabled state / retry
    } finally {
      setUploading(false);
    }
  }

  function toggleAmenity(id: string) {
    setSelectedAmenities((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-5">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" className="mt-1" {...register("title")} />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={5}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("description")}
            />
            {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Property type</Label>
              <select id="type" className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm" {...register("type")}>
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="listingType">Listing type</Label>
              <select
                id="listingType"
                className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                {...register("listingType")}
              >
                {LISTING_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" step="0.01" className="mt-1" {...register("price", { valueAsNumber: true })} />
              {errors.price && <p className="mt-1 text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div>
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input id="bedrooms" type="number" className="mt-1" {...register("bedrooms", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input id="bathrooms" type="number" className="mt-1" {...register("bathrooms", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="areaSqm">Area (m²)</Label>
              <Input id="areaSqm" type="number" className="mt-1" {...register("areaSqm", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" className="mt-1" {...register("country")} />
              {errors.country && <p className="mt-1 text-xs text-destructive">{errors.country.message}</p>}
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" className="mt-1" {...register("city")} />
              {errors.city && <p className="mt-1 text-xs text-destructive">{errors.city.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="district">District / neighborhood</Label>
            <Input id="district" className="mt-1" {...register("district")} />
          </div>

          {amenities && amenities.length > 0 && (
            <div>
              <Label>Amenities</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {amenities.map((amenity) => (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      selectedAmenities.includes(amenity.id)
                        ? "border-secondary bg-secondary text-secondary-foreground"
                        : "border-border"
                    }`}
                  >
                    {amenity.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label>Photos</Label>
            <div className="mt-2 flex flex-wrap gap-3">
              {images.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt="Property" className="h-20 w-28 rounded-lg object-cover" />
              ))}
            </div>
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="mt-2 text-sm" />
            {uploading && <p className="mt-1 text-xs text-muted-foreground">Uploading...</p>}
          </div>

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? "Saving..." : isEdit ? "Save changes" : "Create listing"}
          </Button>
          {mutation.isError && <p className="text-sm text-destructive">Something went wrong. Please try again.</p>}
        </form>
      </CardContent>
    </Card>
  );
}
