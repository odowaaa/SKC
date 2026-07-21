"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateMortgage } from "@/lib/mortgage";
import { formatPrice } from "@/lib/utils";

export function MortgageCalculator({ initialPrice, currency = "USD" }: { initialPrice?: number; currency?: string }) {
  const [price, setPrice] = useState(initialPrice ?? 150000);
  const [downPayment, setDownPayment] = useState(Math.round((initialPrice ?? 150000) * 0.2));
  const [rate, setRate] = useState(7.5);
  const [term, setTerm] = useState(20);

  const result = useMemo(
    () => calculateMortgage({ principal: price, downPayment, annualRatePercent: rate, termYears: term }),
    [price, downPayment, rate, term],
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="price">Property price</Label>
            <Input
              id="price"
              type="number"
              className="mt-1"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="downPayment">Down payment</Label>
            <Input
              id="downPayment"
              type="number"
              className="mt-1"
              value={downPayment}
              onChange={(e) => setDownPayment(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="rate">Interest rate (% / year)</Label>
            <Input
              id="rate"
              type="number"
              step="0.1"
              className="mt-1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor="term">Loan term (years)</Label>
            <Input
              id="term"
              type="number"
              className="mt-1"
              value={term}
              onChange={(e) => setTerm(Number(e.target.value) || 1)}
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 rounded-lg bg-muted p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Monthly payment</p>
            <p className="text-xl font-bold text-secondary">{formatPrice(result.monthlyPayment, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total interest</p>
            <p className="text-xl font-bold">{formatPrice(result.totalInterest, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total repayment</p>
            <p className="text-xl font-bold">{formatPrice(result.totalPayment, currency)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
