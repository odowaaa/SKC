"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSavedSearch } from "@/lib/api/interest";
import { useAuthStore } from "@/store/auth-store";

const PROPERTY_TYPES = [
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "TOWNHOUSE",
  "STUDIO",
  "LAND",
  "OFFICE",
  "WAREHOUSE",
  "SHOP",
];

export function PropertyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);

  const saveSearchMutation = useMutation({
    mutationFn: () => {
      const filters: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        filters[key] = value;
      });
      const name = [filters.city, filters.type, filters.listingType].filter(Boolean).join(" · ") || "My search";
      return createSavedSearch(name, filters);
    },
  });

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [minBedrooms, setMinBedrooms] = useState(searchParams.get("minBedrooms") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`/properties?${params.toString()}`);
  }

  function applyRangeFilters() {
    const params = new URLSearchParams(searchParams.toString());
    if (city) params.set("city", city);
    else params.delete("city");
    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");
    if (minBedrooms) params.set("minBedrooms", minBedrooms);
    else params.delete("minBedrooms");
    params.set("page", "1");
    router.push(`/properties?${params.toString()}`);
  }

  const activeType = searchParams.get("type");
  const AMENITY_TOGGLES: { key: string; label: string }[] = [
    { key: "swimmingPool", label: "Swimming Pool" },
    { key: "garden", label: "Garden" },
    { key: "petsAllowed", label: "Pets Allowed" },
    { key: "airConditioning", label: "Air Conditioning" },
    { key: "gym", label: "Gym" },
    { key: "security", label: "Security" },
    { key: "parking", label: "Parking" },
  ];

  return (
    <aside className="space-y-6 rounded-xl border border-border bg-card p-5">
      <div>
        <Label htmlFor="city">City</Label>
        <Input id="city" value={city} onChange={(event) => setCity(event.target.value)} className="mt-1" placeholder="e.g. Mogadishu" />
      </div>

      <div>
        <Label>Property type</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => updateParam("type", activeType === type ? null : type)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                activeType === type ? "border-secondary bg-secondary text-secondary-foreground" : "border-border"
              }`}
            >
              {type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Price range (USD)</Label>
        <div className="mt-1 flex gap-2">
          <Input placeholder="Min" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} type="number" />
          <Input placeholder="Max" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} type="number" />
        </div>
      </div>

      <div>
        <Label htmlFor="minBedrooms">Min bedrooms</Label>
        <Input
          id="minBedrooms"
          type="number"
          value={minBedrooms}
          onChange={(event) => setMinBedrooms(event.target.value)}
          className="mt-1"
        />
      </div>

      <div>
        <Label>Amenities</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {AMENITY_TOGGLES.map((toggle) => {
            const active = searchParams.get(toggle.key) === "true";
            return (
              <button
                key={toggle.key}
                onClick={() => updateParam(toggle.key, active ? null : "true")}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  active ? "border-success bg-success text-success-foreground" : "border-border"
                }`}
              >
                {toggle.label}
              </button>
            );
          })}
        </div>
      </div>

      <Button className="w-full" onClick={applyRangeFilters}>
        Apply filters
      </Button>

      {user && (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => saveSearchMutation.mutate()}
          disabled={saveSearchMutation.isPending}
        >
          <Bookmark className="h-4 w-4" />
          {saveSearchMutation.isSuccess ? "Search saved" : "Save this search"}
        </Button>
      )}
    </aside>
  );
}
