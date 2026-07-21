"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitRequestInfo } from "@/lib/api/interest";

const schema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  message: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

export function RequestInfoForm({ propertyId }: { propertyId: string }) {
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      submitRequestInfo(propertyId, { ...values, email: values.email || undefined }),
    onSuccess: () => setSuccess(true),
  });

  if (success) {
    return (
      <p className="text-sm text-success">
        Thanks! Your request has been sent to the listing agent — they&apos;ll be in touch shortly.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-3">
      <div>
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" className="mt-1" {...register("fullName")} />
        {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" className="mt-1" {...register("email")} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" className="mt-1" {...register("phone")} />
        </div>
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Input id="message" placeholder="I'd like more details about this property" className="mt-1" {...register("message")} />
      </div>
      <Button type="submit" variant="outline" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Sending..." : "Request information"}
      </Button>
      {mutation.isError && <p className="text-xs text-destructive">Something went wrong. Please try again.</p>}
    </form>
  );
}
