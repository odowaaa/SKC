import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = { title: "Pricing", description: "AMODA plans for agents, owners, and developers." };

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "For individuals listing a single property.",
    features: ["1 active listing", "Basic analytics", "Email support"],
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For agents managing a growing portfolio.",
    features: ["Unlimited listings", "Featured placement credits", "Lead management CRM", "Priority support"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For agencies and developers with large teams.",
    features: ["Team seats & roles", "API access", "Dedicated account manager", "Custom integrations"],
  },
];

export default function PricingPage() {
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold">Simple, transparent pricing</h1>
        <p className="mt-4 text-muted-foreground">Choose the plan that fits how you list and manage properties.</p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.name} className={plan.highlighted ? "border-secondary shadow-lg" : ""}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-3xl font-bold">
                {plan.price}
                <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
              </p>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success" /> {feature}
                </div>
              ))}
              <Link href="/register">
                <Button className="mt-4 w-full" variant={plan.highlighted ? "primary" : "outline"}>
                  Get started
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
