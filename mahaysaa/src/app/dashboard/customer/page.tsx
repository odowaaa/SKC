"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useAuth } from "@/lib/auth-client";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

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

interface AddressRow {
  id: string;
  label: string;
  line1: string;
  city: string;
  isDefault: boolean;
}

export default function CustomerDashboard() {
  const { t, locale } = useTranslation();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [newAddress, setNewAddress] = useState({ label: "", line1: "", city: "Mogadishu" });

  function loadOrders() {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []));
  }

  function loadAddresses() {
    fetch("/api/addresses")
      .then((r) => r.json())
      .then((d) => setAddresses(d.addresses ?? []));
  }

  useEffect(() => {
    if (!user) return;
    loadOrders();
    loadAddresses();
    fetch("/api/referral")
      .then((r) => r.json())
      .then((d) => setReferrals(d.referralCodes ?? []));
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => setFavorites((d.favorites ?? []).map((f: { product: Product }) => f.product)));
  }, [user]);

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!newAddress.label || !newAddress.line1) return;
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAddress),
    });
    if (res.ok) {
      setNewAddress({ label: "", line1: "", city: "Mogadishu" });
      loadAddresses();
    }
  }

  async function removeAddress(id: string) {
    const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    if (res.ok) loadAddresses();
  }

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

      <h2 className="mb-3 mt-10 text-lg font-bold text-slate-800">
        {locale === "so" ? "Cinwaanadayda" : "Saved Addresses"}
      </h2>
      <div className="space-y-2">
        {addresses.length === 0 && <p className="text-sm text-slate-500">-</p>}
        {addresses.map((a) => (
          <div key={a.id} className="card flex items-center justify-between p-3">
            <div>
              <p className="text-sm font-semibold">
                {a.label} {a.isDefault && <span className="badge bg-primary/10 text-primary">Default</span>}
              </p>
              <p className="text-xs text-slate-500">
                {a.line1}, {a.city}
              </p>
            </div>
            <button className="text-xs font-medium text-red-600" onClick={() => removeAddress(a.id)}>
              {locale === "so" ? "Tirtir" : "Remove"}
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={addAddress} className="card mt-3 flex flex-wrap items-end gap-3 p-3">
        <div>
          <label className="label">{locale === "so" ? "Magaca (tusaale: Guriga)" : "Label (e.g. Home)"}</label>
          <input
            className="input w-40"
            value={newAddress.label}
            onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
          />
        </div>
        <div>
          <label className="label">{locale === "so" ? "Cinwaanka" : "Address"}</label>
          <input
            className="input w-56"
            value={newAddress.line1}
            onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
          />
        </div>
        <div>
          <label className="label">{locale === "so" ? "Magaalada" : "City"}</label>
          <input
            className="input w-40"
            value={newAddress.city}
            onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
          />
        </div>
        <button className="btn-primary">{t("common.save")}</button>
      </form>

      <h2 className="mb-3 mt-10 text-lg font-bold text-slate-800">
        {locale === "so" ? "Kaydka" : "Favorites"}
      </h2>
      {favorites.length === 0 ? (
        <p className="text-sm text-slate-500">-</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {favorites.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
