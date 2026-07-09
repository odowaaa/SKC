import type { Metadata } from "next";
import { Building2, HandCoins, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About AMODA",
  description: "Learn about AMODA, Somalia's modern real estate marketplace.",
};

const VALUES = [
  { icon: ShieldCheck, title: "Verified listings", body: "Every listing is reviewed before it goes live, so buyers and renters can search with confidence." },
  { icon: Users, title: "Built for professionals", body: "Agents, owners, and developers get dedicated dashboards to manage listings, leads, and bookings." },
  { icon: HandCoins, title: "Transparent pricing", body: "Clear listing fees and commission structures with no hidden charges." },
  { icon: Building2, title: "Local expertise", body: "Deep coverage across Mogadishu, Hargeisa, and every major Somali city." },
];

export default function AboutPage() {
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold">About AMODA</h1>
        <p className="mt-4 text-muted-foreground">
          AMODA — Your Property Partner — is a modern real estate platform built to connect buyers, renters,
          agents, owners, and developers across Somalia. We combine verified listings, transparent pricing, and
          professional tools to make property search and management effortless.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {VALUES.map((value) => (
          <Card key={value.title}>
            <CardContent className="pt-6">
              <value.icon className="h-8 w-8 text-secondary" />
              <h3 className="mt-4 font-semibold">{value.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{value.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
