"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listMyBookings } from "@/lib/api/properties";
import { formatDate } from "@/lib/utils";

interface BookingEntry {
  id: string;
  status: string;
  scheduledAt: string;
  note?: string | null;
  property: { title: string; slug: string; city: string };
}

export default function DashboardBookingsPage() {
  const { data, isLoading } = useQuery<BookingEntry[]>({
    queryKey: ["bookings", "mine"],
    queryFn: listMyBookings,
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My viewings</h1>
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {!isLoading && data?.length === 0 && <p className="text-muted-foreground">No scheduled viewings yet.</p>}
      <div className="space-y-4">
        {data?.map((booking) => (
          <Card key={booking.id}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="font-semibold">{booking.property.title}</p>
                <p className="text-sm text-muted-foreground">{booking.property.city}</p>
                <p className="mt-1 text-sm">{formatDate(booking.scheduledAt)}</p>
              </div>
              <Badge variant={booking.status === "CONFIRMED" ? "success" : "muted"}>{booking.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
