"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useAuth } from "@/lib/auth-client";

interface OrderRow {
  id: string;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  supplier: { businessName: string };
  items: { product: { name: string }; quantity: number }[];
  delivery?: { status: string } | null;
  review?: { id: string } | null;
}

interface ReferralRow {
  id: string;
  code: string;
  redeemed: boolean;
  supplier: { businessName: string };
  createdAt: string;
}

export default function CustomerDashboard() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);

  function loadOrders() {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []));
  }

  useEffect(() => {
    if (!user) return;
    loadOrders();
    fetch("/api/referral")
      .then((r) => r.json())
      .then((d) => setReferrals(d.referralCodes ?? []));
  }, [user]);

  async function rateOrder(orderId: string) {
    const rating = window.prompt("Rate this order 1-5:", "5");
    if (!rating) return;
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, rating: parseInt(rating) }),
    });
    if (res.ok) loadOrders();
  }

  if (loading) return <div className="p-8 text-sm text-slate-500">{t("common.loading")}</div>;
  if (!user) return <div className="p-8 text-sm text-slate-500">Please log in.</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>

      <h2 className="mb-3 mt-8 text-lg font-bold text-slate-800">{t("dashboard.customer.orders")}</h2>
      <div className="space-y-3">
        {orders.length === 0 && <p className="text-sm text-slate-500">-</p>}
        {orders.map((o) => (
          <div key={o.id} className="card flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <p className="text-sm font-semibold">{o.supplier.businessName}</p>
              <p className="text-xs text-slate-500">
                {o.items.map((i) => `${i.product.name} x${i.quantity}`).join(", ")}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">
                {t("common.currency")}
                {o.total.toFixed(2)}
              </p>
              <span className="badge bg-primary/10 text-primary">{o.status}</span>
              {o.status === "DELIVERED" && !o.review && (
                <button className="mt-1 block text-xs font-medium text-accent-600" onClick={() => rateOrder(o.id)}>
                  Rate order
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-10 text-lg font-bold text-slate-800">{t("dashboard.customer.referrals")}</h2>
      <div className="space-y-2">
        {referrals.length === 0 && <p className="text-sm text-slate-500">-</p>}
        {referrals.map((r) => (
          <div key={r.id} className="card flex items-center justify-between p-3">
            <div>
              <p className="font-mono font-bold text-secondary-600">{r.code}</p>
              <p className="text-xs text-slate-500">{r.supplier.businessName}</p>
            </div>
            <span className={`badge ${r.redeemed ? "bg-slate-100 text-slate-500" : "bg-secondary-50 text-secondary-600"}`}>
              {r.redeemed ? "Used" : "Active"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
