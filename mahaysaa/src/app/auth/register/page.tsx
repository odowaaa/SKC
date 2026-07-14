"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useAuth } from "@/lib/auth-client";

export default function RegisterPage() {
  const { t } = useTranslation();
  const { refresh } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CUSTOMER" | "SUPPLIER" | "DRIVER">("CUSTOMER");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, password, role }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      await refresh();
      if (role === "SUPPLIER") router.push("/supplier/register");
      else if (role === "DRIVER") router.push("/driver/register");
      else router.push("/");
    } else {
      setError(data.error);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card p-6">
        <h1 className="mb-6 text-xl font-bold text-slate-900">{t("auth.register.title")}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{t("auth.role")}</label>
            <div className="grid grid-cols-3 gap-2">
              {(["CUSTOMER", "SUPPLIER", "DRIVER"] as const).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium ${
                    role === r ? "border-primary bg-primary/10 text-primary" : "border-slate-300 text-slate-600"
                  }`}
                >
                  {t(`auth.role.${r.toLowerCase()}`)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">{t("auth.name")}</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">{t("auth.phone")}</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2526XXXXXXXX" required />
          </div>
          <div>
            <label className="label">{t("auth.email")}</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">{t("auth.password")}</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {t("auth.submit.register")}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          {t("auth.haveAccount")}{" "}
          <Link href="/auth/login" className="font-medium text-primary">
            {t("nav.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
