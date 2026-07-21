"use client";

import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { disableTwoFactorRequest, enableTwoFactorRequest, setupTwoFactorRequest } from "@/lib/api/auth";

const codeSchema = z.object({ token: z.string().length(6, "Enter the 6-digit code") });
type CodeInput = z.infer<typeof codeSchema>;

export default function SecurityPage() {
  const [step, setStep] = useState<"idle" | "setup" | "enabled">("idle");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  const setupMutation = useMutation({
    mutationFn: setupTwoFactorRequest,
    onSuccess: (data) => {
      setQrCodeDataUrl(data.qrCodeDataUrl);
      setSecret(data.secret);
      setStep("setup");
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CodeInput>({ resolver: zodResolver(codeSchema) });

  const enableMutation = useMutation({
    mutationFn: (values: CodeInput) => enableTwoFactorRequest(values.token),
    onSuccess: () => {
      setStep("enabled");
      reset();
    },
  });

  const disableMutation = useMutation({
    mutationFn: (values: CodeInput) => disableTwoFactorRequest(values.token),
    onSuccess: () => {
      setStep("idle");
      setQrCodeDataUrl(null);
      reset();
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Security</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-secondary" /> Two-factor authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === "idle" && (
            <div>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account using an authenticator app (Google Authenticator, Authy, etc).
              </p>
              <Button className="mt-4" onClick={() => setupMutation.mutate()} disabled={setupMutation.isPending}>
                {setupMutation.isPending ? "Generating..." : "Set up two-factor authentication"}
              </Button>
            </div>
          )}

          {step === "setup" && qrCodeDataUrl && (
            <div>
              <p className="text-sm text-muted-foreground">Scan this QR code with your authenticator app, then enter the code it generates.</p>
              <div className="my-4 flex justify-center">
                <Image src={qrCodeDataUrl} alt="Two-factor QR code" width={200} height={200} unoptimized />
              </div>
              {secret && (
                <p className="mb-4 text-center text-xs text-muted-foreground">
                  Or enter this key manually: <span className="font-mono">{secret}</span>
                </p>
              )}
              <form onSubmit={handleSubmit((values) => enableMutation.mutate(values))} className="space-y-3">
                <div>
                  <Label htmlFor="token">Authentication code</Label>
                  <Input id="token" inputMode="numeric" maxLength={6} className="mt-1" {...register("token")} />
                  {errors.token && <p className="mt-1 text-xs text-destructive">{errors.token.message}</p>}
                </div>
                {enableMutation.isError && <p className="text-sm text-destructive">Invalid code. Please try again.</p>}
                <Button type="submit" disabled={enableMutation.isPending}>
                  {enableMutation.isPending ? "Enabling..." : "Enable two-factor authentication"}
                </Button>
              </form>
            </div>
          )}

          {step === "enabled" && (
            <div>
              <p className="text-sm text-success">Two-factor authentication is enabled on your account.</p>
              <form onSubmit={handleSubmit((values) => disableMutation.mutate(values))} className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="disableToken">Enter a code to disable</Label>
                  <Input id="disableToken" inputMode="numeric" maxLength={6} className="mt-1" {...register("token")} />
                  {errors.token && <p className="mt-1 text-xs text-destructive">{errors.token.message}</p>}
                </div>
                {disableMutation.isError && <p className="text-sm text-destructive">Invalid code. Please try again.</p>}
                <Button type="submit" variant="destructive" disabled={disableMutation.isPending}>
                  {disableMutation.isPending ? "Disabling..." : "Disable two-factor authentication"}
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
