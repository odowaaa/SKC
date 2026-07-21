"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { loginSchema, type LoginInput } from "@amoda/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginRequest, verifyTwoFactorLoginRequest } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth-store";
import { isAxiosError } from "axios";

const twoFactorSchema = z.object({ token: z.string().length(6, "Enter the 6-digit code") });
type TwoFactorInput = z.infer<typeof twoFactorSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const mutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      if ("twoFactorRequired" in data) {
        setPendingEmail(data.email);
        return;
      }
      setSession(data);
      router.push("/dashboard");
    },
  });

  const {
    register: registerTwoFactor,
    handleSubmit: handleTwoFactorSubmit,
    formState: { errors: twoFactorErrors },
  } = useForm<TwoFactorInput>({ resolver: zodResolver(twoFactorSchema) });

  const twoFactorMutation = useMutation({
    mutationFn: (values: TwoFactorInput) =>
      verifyTwoFactorLoginRequest({ email: pendingEmail!, token: values.token }),
    onSuccess: (data) => {
      setSession(data);
      router.push("/dashboard");
    },
  });

  if (pendingEmail) {
    return (
      <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Two-factor authentication</CardTitle>
            <CardDescription>Enter the 6-digit code from your authenticator app.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTwoFactorSubmit((values) => twoFactorMutation.mutate(values))} className="space-y-4">
              <div>
                <Label htmlFor="token">Authentication code</Label>
                <Input id="token" inputMode="numeric" maxLength={6} className="mt-1" {...registerTwoFactor("token")} />
                {twoFactorErrors.token && <p className="mt-1 text-xs text-destructive">{twoFactorErrors.token.message}</p>}
              </div>
              {twoFactorMutation.isError && <p className="text-sm text-destructive">Invalid authentication code.</p>}
              <Button type="submit" className="w-full" disabled={twoFactorMutation.isPending}>
                {twoFactorMutation.isPending ? "Verifying..." : "Verify"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Log in to manage your properties, bookings, and favorites.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" className="mt-1" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" className="mt-1" {...register("password")} />
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {mutation.isError && (
              <p className="text-sm text-destructive">
                {isAxiosError(mutation.error) && mutation.error.response?.data?.message
                  ? String(mutation.error.response.data.message)
                  : "Unable to log in. Please check your credentials."}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Signing in..." : "Log in"}
            </Button>
          </form>

          <div className="mt-4 flex justify-between text-sm">
            <Link href="/forgot-password" className="text-secondary hover:underline">
              Forgot password?
            </Link>
            <Link href="/register" className="text-secondary hover:underline">
              Create an account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
