"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBooking } from "@/lib/api/properties";
import { useAuthStore } from "@/store/auth-store";

const schema = z.object({
  scheduledAt: z.string().min(1, "Please choose a date and time"),
  note: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

export function BookingForm({ propertyId }: { propertyId: string }) {
  const [success, setSuccess] = useState(false);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createBooking(propertyId, { scheduledAt: new Date(values.scheduledAt).toISOString(), note: values.note }),
    onSuccess: () => setSuccess(true),
  });

  if (!user) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        <Button className="w-full" onClick={() => router.push("/login")}>
          Log in to schedule a viewing
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-lg border border-success bg-success/10 p-4 text-sm text-success">
        Your viewing request has been sent. We&apos;ll confirm shortly by email.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-3">
      <div>
        <Label htmlFor="scheduledAt">Preferred date &amp; time</Label>
        <Input id="scheduledAt" type="datetime-local" className="mt-1" {...register("scheduledAt")} />
        {errors.scheduledAt && <p className="mt-1 text-xs text-destructive">{errors.scheduledAt.message}</p>}
      </div>
      <div>
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" className="mt-1" placeholder="Any questions for the agent?" {...register("note")} />
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Scheduling..." : "Schedule viewing"}
      </Button>
      {mutation.isError && <p className="text-xs text-destructive">Something went wrong. Please try again.</p>}
    </form>
  );
}
