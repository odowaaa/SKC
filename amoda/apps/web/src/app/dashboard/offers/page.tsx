"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listOffers, updateOfferStatus } from "@/lib/api/offers";
import { formatDate, formatPrice } from "@/lib/utils";

interface Offer {
  id: string;
  buyerName: string;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  amount: string;
  currency: string;
  status: string;
  note?: string | null;
  createdAt: string;
  property: { title: string; slug: string; price: string; currency: string };
}

const STATUS_VARIANT: Record<string, "success" | "muted" | "accent"> = {
  PENDING: "accent",
  ACCEPTED: "success",
  REJECTED: "muted",
  WITHDRAWN: "muted",
  COUNTERED: "accent",
};

export default function OffersPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<Offer[]>({ queryKey: ["offers"], queryFn: listOffers });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateOfferStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["offers"] }),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Offers</h1>
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {!isLoading && data?.length === 0 && <p className="text-muted-foreground">No offers yet.</p>}
      <div className="space-y-3">
        {data?.map((offer) => (
          <Card key={offer.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{offer.property.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {offer.buyerName} {offer.buyerEmail ? `· ${offer.buyerEmail}` : ""} {offer.buyerPhone ? `· ${offer.buyerPhone}` : ""}
                  </p>
                  {offer.note && <p className="mt-1 text-sm text-muted-foreground">&ldquo;{offer.note}&rdquo;</p>}
                  <p className="text-xs text-muted-foreground">{formatDate(offer.createdAt)}</p>
                </div>
                <div className="text-right">
                  <Badge variant={STATUS_VARIANT[offer.status] ?? "muted"}>{offer.status}</Badge>
                  <p className="mt-2 text-lg font-bold text-secondary">{formatPrice(offer.amount, offer.currency)}</p>
                  <p className="text-xs text-muted-foreground">
                    Listed at {formatPrice(offer.property.price, offer.property.currency)}
                  </p>
                </div>
              </div>

              {offer.status === "PENDING" && (
                <div className="mt-4 flex gap-2 border-t border-border pt-3">
                  <Button size="sm" onClick={() => statusMutation.mutate({ id: offer.id, status: "ACCEPTED" })}>
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => statusMutation.mutate({ id: offer.id, status: "REJECTED" })}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => statusMutation.mutate({ id: offer.id, status: "COUNTERED" })}
                  >
                    Mark countered
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
