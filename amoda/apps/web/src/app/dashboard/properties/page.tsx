"use client";

import Link from "next/link";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";
import { listMyProperties } from "@/lib/api/properties";
import { listAllProperties, setPropertyFeatured, updatePropertyStatus } from "@/lib/api/admin";
import { formatPrice } from "@/lib/utils";
import type { PropertySummary } from "@/lib/types";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "PROPERTY_MANAGER"];

const STATUS_VARIANT: Record<string, "success" | "accent" | "muted" | "default"> = {
  PUBLISHED: "success",
  PENDING_REVIEW: "accent",
  DRAFT: "muted",
  REJECTED: "muted",
  ARCHIVED: "muted",
};

export default function DashboardPropertiesPage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user ? ADMIN_ROLES.includes(user.role) : false;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PropertySummary[]>({
    queryKey: ["dashboard-properties", isAdmin],
    queryFn: async () => (isAdmin ? (await listAllProperties({ limit: 50 })).data : await listMyProperties()),
    enabled: Boolean(user),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updatePropertyStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-properties"] }),
  });

  const featureMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) => setPropertyFeatured(id, isFeatured),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-properties"] }),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isAdmin ? "All properties" : "My properties"}</h1>
        {!isAdmin && (
          <Link href="/dashboard/properties/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add property
            </Button>
          </Link>
        )}
      </div>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {!isLoading && data?.length === 0 && <p className="text-muted-foreground">No properties yet.</p>}

      <div className="space-y-3">
        {data?.map((property) => (
          <Card key={property.id}>
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold">{property.title}</p>
                  <Badge variant={STATUS_VARIANT[property.status] ?? "default"}>{property.status.replace(/_/g, " ")}</Badge>
                  {property.isFeatured && <Badge variant="accent">Featured</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {property.city} · {formatPrice(property.price, property.currency)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {isAdmin && property.status === "PENDING_REVIEW" && (
                  <>
                    <Button size="sm" onClick={() => statusMutation.mutate({ id: property.id, status: "PUBLISHED" })}>
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => statusMutation.mutate({ id: property.id, status: "REJECTED" })}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => featureMutation.mutate({ id: property.id, isFeatured: !property.isFeatured })}
                  >
                    {property.isFeatured ? "Unfeature" : "Feature"}
                  </Button>
                )}
                <Link href={`/dashboard/properties/${property.id}/edit`}>
                  <Button size="sm" variant="ghost">
                    Edit
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
