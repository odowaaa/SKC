"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LISTING_TABS = [
  { value: "SALE", label: "Buy" },
  { value: "RENT", label: "Rent" },
  { value: "COMMERCIAL", label: "Commercial" },
];

export function HeroSearch() {
  const router = useRouter();
  const [listingType, setListingType] = useState("SALE");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");

  function handleSearch() {
    const params = new URLSearchParams();
    params.set("listingType", listingType);
    if (query) params.set("q", query);
    if (city) params.set("city", city);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-3 shadow-xl md:p-4">
      <div className="mb-3 flex gap-1 rounded-lg bg-muted p-1">
        {LISTING_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setListingType(tab.value)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              listingType === tab.value ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 md:flex-row">
        <Input
          placeholder="Search by neighborhood, city, or reference code"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && handleSearch()}
          className="flex-1"
        />
        <Input
          placeholder="City"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && handleSearch()}
          className="md:w-40"
        />
        <Button size="lg" onClick={handleSearch} className="gap-2">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>
    </div>
  );
}
