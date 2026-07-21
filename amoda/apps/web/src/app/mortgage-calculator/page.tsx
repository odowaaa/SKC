import type { Metadata } from "next";
import { MortgageCalculator } from "@/components/mortgage/mortgage-calculator";

export const metadata: Metadata = {
  title: "Mortgage Calculator",
  description: "Estimate your monthly mortgage payment for a property in Somalia.",
};

export default function MortgageCalculatorPage() {
  return (
    <div className="container-page max-w-2xl py-16">
      <h1 className="text-4xl font-bold">Mortgage calculator</h1>
      <p className="mt-2 text-muted-foreground">
        Estimate your monthly payment based on property price, down payment, interest rate, and loan term.
      </p>
      <div className="mt-8">
        <MortgageCalculator />
      </div>
    </div>
  );
}
