"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useAuth } from "@/lib/auth-client";

const AGREEMENT_EN = [
  "Every customer referred from MAHAYSAA must receive the platform discount (if available).",
  "Every customer from MAHAYSAA must be recorded using the supplied Customer Referral Code.",
  "The supplier agrees to pay commission only on successful sales.",
  "The supplier agrees not to bypass MAHAYSAA.",
  "The supplier agrees to maintain accurate pricing.",
  "The supplier agrees to provide genuine products.",
];

const AGREEMENT_SO = [
  "Macmiil kasta oo MAHAYSAA ku soo gudbiyay waa inuu helaa qiimo-dhimista bogga (haddii la heli karo).",
  "Macmiil kasta oo MAHAYSAA ka yimid waa in lagu diiwaan geliyaa Koodhka Xawaaladda Macmiilka.",
  "Ganacsadaha wuxuu ogolyahay inuu bixiyo komishan kaliya marka iib guuleysto.",
  "Ganacsadaha wuxuu ogolyahay inuusan ka gudbin MAHAYSAA.",
  "Ganacsadaha wuxuu ogolyahay inuu ilaaliyo qiimayn sax ah.",
  "Ganacsadaha wuxuu ogolyahay inuu bixiyo alaab dhab ah.",
];

export default function SupplierRegisterPage() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    businessName: "",
    ownerName: user?.name ?? "",
    whatsapp: "",
    city: "Mogadishu",
    description: "",
    workingHours: "",
    signatureName: "",
  });
  const [accepted, setAccepted] = useState(false);
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
    if (user.role !== "SUPPLIER") {
      setError(locale === "so" ? "Waa inaad isku diiwaangelisaa akoon ganacsade ah." : "Please sign up with a supplier account first.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/suppliers/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        deliveryAvailable: true,
        paymentMethods: ["CASH_ON_DELIVERY", "EVC_PLUS", "ZAAD"],
        agreementAccepted: accepted,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) setSuccess(true);
    else setError(data.error);
  }

  const agreementLines = locale === "so" ? AGREEMENT_SO : AGREEMENT_EN;

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
      <h1 className="text-2xl font-bold text-slate-900">{t("supplier.register.title")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("supplier.register.subtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 card p-6">
        <div>
          <label className="label">Business Name</label>
          <input className="input" value={form.businessName} onChange={(e) => update("businessName", e.target.value)} required />
        </div>
        <div>
          <label className="label">Owner Name</label>
          <input className="input" value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">WhatsApp</label>
            <input className="input" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
          </div>
          <div>
            <label className="label">City</label>
            <input className="input" value={form.city} onChange={(e) => update("city", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Working Hours</label>
          <input className="input" placeholder="8:00 AM - 8:00 PM" value={form.workingHours} onChange={(e) => update("workingHours", e.target.value)} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="font-semibold text-slate-800">{t("supplier.agreement.title")}</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
            {agreementLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          <label className="mt-3 flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" className="mt-1" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} required />
            {t("supplier.agreement.accept")}
          </label>
          <div className="mt-3">
            <label className="label">{t("supplier.agreement.signature")}</label>
            <input className="input font-serif italic" value={form.signatureName} onChange={(e) => update("signatureName", e.target.value)} required />
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button className="btn-primary w-full" disabled={busy || !accepted}>
          {t("supplier.register.submit")}
        </button>
      </form>
    </div>
  );
}
