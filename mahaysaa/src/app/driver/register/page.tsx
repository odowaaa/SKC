"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useAuth } from "@/lib/auth-client";

const VEHICLE_TYPES = ["TUK_TUK", "MOTORCYCLE", "PICKUP", "MINI_TRUCK", "THREE_WHEELER", "SMALL_LORRY"] as const;

export default function DriverRegisterPage() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: user?.name ?? "",
    nationalId: "",
    licenseNumber: "",
    workingHours: "",
    vehicleType: "TUK_TUK" as (typeof VEHICLE_TYPES)[number],
    plate: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (user.role !== "DRIVER") {
      setError(locale === "so" ? "Waa inaad isku diiwaangelisaa akoon wadaha ah." : "Please sign up with a driver account first.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/drivers/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) setSuccess(true);
    else setError(data.error);
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="card p-8">
          <p className="text-2xl">✅</p>
          <h1 className="mt-2 text-xl font-bold text-slate-900">{t("supplier.register.pending")}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">{t("driver.register.title")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("driver.register.subtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 card p-6">
        <div>
          <label className="label">Full Name</label>
          <input className="input" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">National ID</label>
            <input className="input" value={form.nationalId} onChange={(e) => update("nationalId", e.target.value)} />
          </div>
          <div>
            <label className="label">License Number</label>
            <input className="input" value={form.licenseNumber} onChange={(e) => update("licenseNumber", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Working Hours</label>
          <input className="input" placeholder="7:00 AM - 9:00 PM" value={form.workingHours} onChange={(e) => update("workingHours", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Vehicle Type</label>
            <select className="input" value={form.vehicleType} onChange={(e) => update("vehicleType", e.target.value)}>
              {VEHICLE_TYPES.map((v) => (
                <option key={v} value={v}>
                  {v.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Plate Number</label>
            <input className="input" value={form.plate} onChange={(e) => update("plate", e.target.value)} required />
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button className="btn-primary w-full" disabled={busy}>
          {t("driver.register.submit")}
        </button>
      </form>
    </div>
  );
}
