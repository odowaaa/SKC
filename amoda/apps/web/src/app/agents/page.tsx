import type { Metadata } from "next";
import { ShieldCheck, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { serverFetch } from "@/lib/server-fetch";

export const metadata: Metadata = { title: "Our Agents", description: "Meet AMODA's verified real estate agents." };

interface AgentListItem {
  id: string;
  agencyName?: string | null;
  bio?: string | null;
  yearsExperience?: number | null;
  rating: string;
  isVerified: boolean;
  user: { firstName: string; lastName: string; avatarUrl?: string | null };
  _count: { properties: number };
}

export default async function AgentsPage() {
  const agents = await serverFetch<AgentListItem[]>("/agents").catch(() => []);

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold">Meet our agents</h1>
        <p className="mt-4 text-muted-foreground">Verified professionals ready to help you buy, sell, or rent.</p>
      </div>

      {agents.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">No verified agents yet — check back soon.</p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {agent.user.firstName[0]}
                    {agent.user.lastName[0]}
                  </div>
                  <div>
                    <p className="flex items-center gap-1 font-semibold">
                      {agent.user.firstName} {agent.user.lastName}
                      {agent.isVerified && <ShieldCheck className="h-4 w-4 text-success" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{agent.agencyName ?? "Independent Agent"}</p>
                  </div>
                </div>
                {agent.bio && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{agent.bio}</p>}
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-accent" /> {Number(agent.rating).toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">{agent._count.properties} listings</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
