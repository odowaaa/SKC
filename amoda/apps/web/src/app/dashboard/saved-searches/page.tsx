"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteSavedSearch, listSavedSearches, type SavedSearch } from "@/lib/api/interest";
import { formatDate } from "@/lib/utils";

export default function SavedSearchesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<SavedSearch[]>({ queryKey: ["saved-searches"], queryFn: listSavedSearches });

  const deleteMutation = useMutation({
    mutationFn: deleteSavedSearch,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-searches"] }),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Saved searches</h1>
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {!isLoading && data?.length === 0 && (
        <p className="text-muted-foreground">
          No saved searches yet. Apply filters on the{" "}
          <Link href="/properties" className="text-secondary hover:underline">
            properties page
          </Link>{" "}
          and click &quot;Save this search&quot;.
        </p>
      )}
      <div className="space-y-3">
        {data?.map((search) => {
          const params = new URLSearchParams(search.filters as Record<string, string>);
          return (
            <Card key={search.id}>
              <CardContent className="flex items-center justify-between gap-4 pt-6">
                <div>
                  <Link href={`/properties?${params.toString()}`} className="font-semibold hover:underline">
                    {search.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">Saved {formatDate(search.createdAt)}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(search.id)} aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
