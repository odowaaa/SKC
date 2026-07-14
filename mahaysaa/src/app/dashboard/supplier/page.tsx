"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useAuth } from "@/lib/auth-client";

interface SupplierData {
  id: string;
  businessName: string;
  status: string;
  products: { id: string; name: string; price: number; stock: number; isActive: boolean }[];
  orders: {
    id: string;
    total: number;
    status: string;
    customer: { name: string };
    commission?: { commissionAmount: number; supplierPayout: number } | null;
  }[];
}

const NEXT_STATUS: Record<string, string> = {
  CONFIRMED: "PREPARING",
  PREPARING: "READY_FOR_DELIVERY",
};

const NEXT_STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Start Preparing",
  PREPARING: "Mark Ready for Delivery",
};

const CANCELABLE_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_DELIVERY"];

interface Category {
  id: string;
  name: string;
  nameSo: string;
}

export default function SupplierDashboard() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [data, setData] = useState<SupplierData | null>(null);
  const [totals, setTotals] = useState({ revenue: 0, totalCommission: 0, payout: 0 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", nameSo: "", price: "", stock: "", categoryId: "", imageUrl: "" });
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function load() {
    fetch("/api/suppliers/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.supplier) {
          setData(d.supplier);
          setTotals(d.totals);
        }
      });
  }

  useEffect(() => {
    if (!user) return;
    load();
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
  }, [user]);

  if (loading) return <div className="p-8 text-sm text-slate-500">{t("common.loading")}</div>;
  if (!user || user.role !== "SUPPLIER") return <div className="p-8 text-sm text-slate-500">Access denied.</div>;
  if (!data) return <div className="p-8 text-sm text-slate-500">{t("common.loading")}</div>;

  if (data.status !== "APPROVED") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="card p-8">
          <p className="text-2xl">⏳</p>
          <h1 className="mt-2 text-lg font-bold text-slate-900">{t("supplier.register.pending")}</h1>
          <p className="mt-1 text-sm text-slate-500">Status: {data.status}</p>
        </div>
      </div>
    );
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: form });
    const d = await res.json();
    setUploading(false);
    if (res.ok) setNewProduct((p) => ({ ...p, imageUrl: d.url }));
    else setError(d.error);
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newProduct.name,
        nameSo: newProduct.nameSo,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock) || 0,
        categoryId: newProduct.categoryId,
        imageUrl: newProduct.imageUrl || undefined,
      }),
    });
    const d = await res.json();
    if (res.ok) {
      setShowForm(false);
      setNewProduct({ name: "", nameSo: "", price: "", stock: "", categoryId: "", imageUrl: "" });
      load();
    } else {
      setError(d.error);
    }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">{data.businessName}</h1>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs text-slate-500">{t("dashboard.supplier.revenue")}</p>
          <p className="text-xl font-bold text-primary">${totals.revenue.toFixed(2)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">{t("dashboard.supplier.commission")}</p>
          <p className="text-xl font-bold text-accent-600">${totals.totalCommission.toFixed(2)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">Payout</p>
          <p className="text-xl font-bold text-secondary-600">${totals.payout.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">{t("dashboard.supplier.products")}</h2>
        <button className="btn-primary text-sm" onClick={() => setShowForm((v) => !v)}>
          {t("dashboard.supplier.addProduct")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addProduct} className="card mt-3 space-y-3 p-4">
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Name (English)" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} required />
            <input className="input" placeholder="Magaca (Somali)" value={newProduct.nameSo} onChange={(e) => setNewProduct({ ...newProduct, nameSo: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input className="input" type="number" step="0.01" placeholder="Price" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} required />
            <input className="input" type="number" placeholder="Stock" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} required />
            <select className="input" value={newProduct.categoryId} onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })} required>
              <option value="">Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Product Photo</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
            />
            {uploading && <p className="mt-1 text-xs text-slate-500">Uploading...</p>}
            {newProduct.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={newProduct.imageUrl} alt="Preview" className="mt-2 h-20 w-20 rounded-lg object-cover" />
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary" disabled={uploading}>
            {t("common.save")}
          </button>
        </form>
      )}

      <div className="mt-3 space-y-2">
        {data.products.map((p) => (
          <div key={p.id} className="card flex items-center justify-between p-3">
            <p className="text-sm font-medium">{p.name}</p>
            <p className="text-sm text-slate-500">
              ${p.price.toFixed(2)} &middot; {p.stock} in stock
            </p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-10 text-lg font-bold text-slate-800">{t("dashboard.supplier.orders")}</h2>
      <div className="space-y-2">
        {data.orders.map((o) => (
          <div key={o.id} className="card flex items-center justify-between p-3">
            <div>
              <p className="text-sm font-medium">{o.customer.name}</p>
              <span className="badge bg-primary/10 text-primary">{o.status}</span>
            </div>
            <div className="text-right text-sm">
              <p className="font-bold">${o.total.toFixed(2)}</p>
              {o.commission && <p className="text-xs text-slate-500">Payout: ${o.commission.supplierPayout.toFixed(2)}</p>}
              <div className="mt-1 flex justify-end gap-2">
                {NEXT_STATUS[o.status] && (
                  <button
                    className="btn-secondary px-2 py-1 text-xs"
                    onClick={() => updateOrderStatus(o.id, NEXT_STATUS[o.status])}
                  >
                    {NEXT_STATUS_LABEL[o.status]}
                  </button>
                )}
                {CANCELABLE_STATUSES.includes(o.status) && (
                  <button
                    className="btn-outline px-2 py-1 text-xs text-red-600"
                    onClick={() => updateOrderStatus(o.id, "CANCELLED")}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
