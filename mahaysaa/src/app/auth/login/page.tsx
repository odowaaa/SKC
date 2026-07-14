"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useAuth } from "@/lib/auth-client";

export default function LoginPage() {
  const { t } = useTranslation();
  const { refresh } = useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      await refresh();
      router.push("/");
    } else {
      setError(data.error);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card p-6">
        <h1 className="mb-6 text-xl font-bold text-slate-900">{t("auth.login.title")}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{t("auth.phone")}</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2526XXXXXXXX" required />
          </div>
          <div>
            <label className="label">{t("auth.password")}</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {t("auth.submit.login")}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          {t("auth.noAccount")}{" "}
          <Link href="/auth/register" className="font-medium text-primary">
            {t("nav.register")}
          </Link>
        </p>
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          Demo: +252610000002 / Password123! (customer) &middot; +252610000003 (supplier) &middot;
          +252610000004 (driver) &middot; +252610000001 (admin)
        </p>
      </div>
    </div>
  );
}
