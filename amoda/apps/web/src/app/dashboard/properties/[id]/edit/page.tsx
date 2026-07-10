"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PropertyForm } from "@/components/dashboard/property-form";
import { getPropertyById } from "@/lib/api/properties";

export default function EditPropertyPage() {
  const params = useParams<{ id: string }>();
  const { data: property, isLoading } = useQuery({
    queryKey: ["property", params.id],
    queryFn: () => getPropertyById(params.id),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (!property) return <p className="text-muted-foreground">Property not found.</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit property</h1>
      <PropertyForm property={property} />
    </div>
  );
}
