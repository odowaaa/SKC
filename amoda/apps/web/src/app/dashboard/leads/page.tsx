"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addLeadNote, listLeads, updateLeadStatus } from "@/lib/api/leads";
import { formatDate } from "@/lib/utils";

interface Lead {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  source: string;
  createdAt: string;
  property?: { title: string } | null;
  notes: { id: string; body: string; createdAt: string; author: { firstName: string; lastName: string } }[];
}

const STATUS_OPTIONS = ["NEW", "CONTACTED", "QUALIFIED", "NEGOTIATING", "WON", "LOST"];

const STATUS_VARIANT: Record<string, "success" | "accent" | "muted" | "default"> = {
  NEW: "accent",
  CONTACTED: "default",
  QUALIFIED: "default",
  NEGOTIATING: "accent",
  WON: "success",
  LOST: "muted",
};

function LeadCard({ lead }: { lead: Lead }) {
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateLeadStatus(lead.id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const noteMutation = useMutation({
    mutationFn: () => addLeadNote(lead.id, note),
    onSuccess: () => {
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">{lead.fullName}</p>
            <p className="text-sm text-muted-foreground">
              {lead.email ?? "—"} {lead.phone ? `· ${lead.phone}` : ""}
            </p>
            {lead.property && <p className="text-sm text-muted-foreground">Interested in: {lead.property.title}</p>}
            <p className="text-xs text-muted-foreground">{formatDate(lead.createdAt)} · {lead.source}</p>
          </div>
          <Badge variant={STATUS_VARIANT[lead.status] ?? "default"}>{lead.status}</Badge>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => statusMutation.mutate(status)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                lead.status === status ? "border-secondary bg-secondary text-secondary-foreground" : "border-border"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {lead.notes.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-border pt-3">
            {lead.notes.map((n) => (
              <div key={n.id} className="text-sm">
                <span className="font-medium">
                  {n.author.firstName} {n.author.lastName}:
                </span>{" "}
                <span className="text-muted-foreground">{n.body}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <Input placeholder="Add a note..." value={note} onChange={(e) => setNote(e.target.value)} />
          <Button size="sm" disabled={!note || noteMutation.isPending} onClick={() => noteMutation.mutate()}>
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LeadsPage() {
  const { data, isLoading } = useQuery<Lead[]>({ queryKey: ["leads"], queryFn: listLeads });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Leads</h1>
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {!isLoading && data?.length === 0 && <p className="text-muted-foreground">No leads yet.</p>}
      <div className="space-y-4">{data?.map((lead) => <LeadCard key={lead.id} lead={lead} />)}</div>
    </div>
  );
}
