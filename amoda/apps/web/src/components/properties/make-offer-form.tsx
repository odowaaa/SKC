"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitOffer } from "@/lib/api/interest";

const schema = z.object({
  buyerName: z.string().min(1, "Name is required"),
  buyerEmail: z.string().email().optional().or(z.literal("")),
  buyerPhone: z.string().optional(),
  amount: z.coerce.number().positive("Enter an offer amount"),
  note: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

export function MakeOfferForm({ propertyId, currency = "USD" }: { propertyId: string; currency?: string }) {
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      submitOffer(propertyId, { ...values, buyerEmail: values.buyerEmail || undefined, currency }),
    onSuccess: () => setSuccess(true),
  });

  if (success) {
    return <p className="text-sm text-success">Your offer has been submitted to the agent for review.</p>;
  }

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-3">
      <div>
        <Label htmlFor="buyerName">Your name</Label>
        <Input id="buyerName" className="mt-1" {...register("buyerName")} />
        {errors.buyerName && <p className="mt-1 text-xs text-destructive">{errors.buyerName.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="buyerEmail">Email</Label>
          <Input id="buyerEmail" type="email" className="mt-1" {...register("buyerEmail")} />
        </div>
        <div>
          <Label htmlFor="buyerPhone">Phone</Label>
          <Input id="buyerPhone" className="mt-1" {...register("buyerPhone")} />
        </div>
      </div>
      <div>
        <Label htmlFor="amount">Offer amount ({currency})</Label>
        <Input id="amount" type="number" className="mt-1" {...register("amount")} />
        {errors.amount && <p className="mt-1 text-xs text-destructive">{errors.amount.message}</p>}
      </div>
      <div>
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" className="mt-1" {...register("note")} />
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Submitting..." : "Submit offer"}
      </Button>
      {mutation.isError && <p className="text-xs text-destructive">Something went wrong. Please try again.</p>}
    </form>
  );
}
