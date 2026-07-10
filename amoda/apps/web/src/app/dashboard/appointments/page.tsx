"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { listAgentBookings } from "@/lib/api/properties";
import { formatDate } from "@/lib/utils";

interface Appointment {
  id: string;
  status: string;
  scheduledAt: string;
  note?: string | null;
  property: { title: string; city: string };
  customer: { firstName: string; lastName: string; email: string; phone?: string | null };
}

const STATUS_VARIANT: Record<string, "success" | "muted" | "accent"> = {
  PENDING: "accent",
  CONFIRMED: "success",
  CANCELLED: "muted",
  COMPLETED: "success",
  RESCHEDULED: "accent",
  NO_SHOW: "muted",
};

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<Appointment[]>({ queryKey: ["agent-bookings"], queryFn: listAgentBookings });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/bookings/${id}/confirm`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agent-bookings"] }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/bookings/${id}/complete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agent-bookings"] }),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Appointments</h1>
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {!isLoading && data?.length === 0 && <p className="text-muted-foreground">No appointments scheduled.</p>}
      <div className="space-y-3">
        {data?.map((appt) => (
          <Card key={appt.id}>
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <div>
                <p className="font-semibold">{appt.property.title}</p>
                <p className="text-sm text-muted-foreground">{appt.property.city}</p>
                <p className="mt-1 text-sm">
                  {appt.customer.firstName} {appt.customer.lastName} · {appt.customer.email}
                </p>
                <p className="text-sm text-muted-foreground">{formatDate(appt.scheduledAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={STATUS_VARIANT[appt.status] ?? "muted"}>{appt.status}</Badge>
                {appt.status === "PENDING" && (
                  <Button size="sm" onClick={() => confirmMutation.mutate(appt.id)}>
                    Confirm
                  </Button>
                )}
                {appt.status === "CONFIRMED" && (
                  <Button size="sm" variant="outline" onClick={() => completeMutation.mutate(appt.id)}>
                    Mark complete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
