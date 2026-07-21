"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLease, generateInvoice, listLeases, terminateLease } from "@/lib/api/leases";
import { listMyProperties } from "@/lib/api/properties";
import { useAuthStore } from "@/store/auth-store";
import { formatDate, formatPrice } from "@/lib/utils";
import type { PropertySummary } from "@/lib/types";

interface Lease {
  id: string;
  status: string;
  rentAmount: string;
  currency: string;
  billingCycle: string;
  startDate: string;
  endDate: string;
  property: { title: string; city: string };
  tenant: { user: { firstName: string; lastName: string; email: string } };
  owner: { user: { firstName: string; lastName: string } };
}

const STATUS_VARIANT: Record<string, "success" | "muted" | "accent"> = {
  ACTIVE: "success",
  EXPIRED: "muted",
  TERMINATED: "muted",
  PENDING_RENEWAL: "accent",
};

function LeaseCard({ lease }: { lease: Lease }) {
  const [dueDate, setDueDate] = useState("");
  const queryClient = useQueryClient();

  const invoiceMutation = useMutation({
    mutationFn: () => generateInvoice(lease.id, new Date(dueDate).toISOString()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leases"] }),
  });

  const terminateMutation = useMutation({
    mutationFn: () => terminateLease(lease.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leases"] }),
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">{lease.property.title}</p>
            <p className="text-sm text-muted-foreground">{lease.property.city}</p>
            <p className="mt-1 text-sm">
              Tenant: {lease.tenant.user.firstName} {lease.tenant.user.lastName} ({lease.tenant.user.email})
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDate(lease.startDate)} — {formatDate(lease.endDate)}
            </p>
          </div>
          <div className="text-right">
            <Badge variant={STATUS_VARIANT[lease.status] ?? "muted"}>{lease.status}</Badge>
            <p className="mt-2 font-semibold">
              {formatPrice(lease.rentAmount, lease.currency)}
              <span className="text-xs font-normal text-muted-foreground"> / {lease.billingCycle.toLowerCase()}</span>
            </p>
          </div>
        </div>

        {lease.status === "ACTIVE" && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-9 rounded-lg border border-border bg-card px-2 text-sm"
            />
            <Button size="sm" disabled={!dueDate || invoiceMutation.isPending} onClick={() => invoiceMutation.mutate()}>
              Generate rent invoice
            </Button>
            <Button size="sm" variant="outline" onClick={() => terminateMutation.mutate()} disabled={terminateMutation.isPending}>
              Terminate lease
            </Button>
          </div>
        )}
        {invoiceMutation.isSuccess && <p className="mt-2 text-xs text-success">Invoice generated.</p>}
      </CardContent>
    </Card>
  );
}

function NewLeaseForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    propertyId: "",
    tenantEmail: "",
    tenantFirstName: "",
    tenantLastName: "",
    startDate: "",
    endDate: "",
    rentAmount: "",
  });

  const { data: properties } = useQuery<PropertySummary[]>({ queryKey: ["my-properties"], queryFn: listMyProperties });

  const mutation = useMutation({
    mutationFn: () =>
      createLease({
        propertyId: form.propertyId,
        tenantEmail: form.tenantEmail,
        tenantFirstName: form.tenantFirstName || undefined,
        tenantLastName: form.tenantLastName || undefined,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        rentAmount: Number(form.rentAmount),
      }),
    onSuccess: () => {
      setForm({ propertyId: "", tenantEmail: "", tenantFirstName: "", tenantLastName: "", startDate: "", endDate: "", rentAmount: "" });
      queryClient.invalidateQueries({ queryKey: ["leases"] });
    },
  });

  const isValid = form.propertyId && form.tenantEmail && form.startDate && form.endDate && form.rentAmount;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h2 className="mb-4 font-semibold">Create a new lease</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Property</Label>
            <select
              className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
              value={form.propertyId}
              onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value }))}
            >
              <option value="">Select a property</option>
              {properties?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Tenant email</Label>
            <Input value={form.tenantEmail} onChange={(e) => setForm((f) => ({ ...f, tenantEmail: e.target.value }))} />
          </div>
          <div>
            <Label>Tenant first name</Label>
            <Input value={form.tenantFirstName} onChange={(e) => setForm((f) => ({ ...f, tenantFirstName: e.target.value }))} />
          </div>
          <div>
            <Label>Tenant last name</Label>
            <Input value={form.tenantLastName} onChange={(e) => setForm((f) => ({ ...f, tenantLastName: e.target.value }))} />
          </div>
          <div>
            <Label>Start date</Label>
            <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div>
            <Label>End date</Label>
            <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
          </div>
          <div>
            <Label>Monthly rent</Label>
            <Input type="number" value={form.rentAmount} onChange={(e) => setForm((f) => ({ ...f, rentAmount: e.target.value }))} />
          </div>
        </div>
        <Button className="mt-4" disabled={!isValid || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? "Creating..." : "Create lease"}
        </Button>
        {mutation.isError && <p className="mt-2 text-sm text-destructive">Something went wrong. Please try again.</p>}
      </CardContent>
    </Card>
  );
}

export default function LeasesPage() {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useQuery<Lease[]>({ queryKey: ["leases"], queryFn: listLeases });
  const canCreate = user?.role === "OWNER" || user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Leases</h1>
      {canCreate && <NewLeaseForm />}
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {!isLoading && data?.length === 0 && <p className="text-muted-foreground">No leases yet.</p>}
      <div className="space-y-4">{data?.map((lease) => <LeaseCard key={lease.id} lease={lease} />)}</div>
    </div>
  );
}
