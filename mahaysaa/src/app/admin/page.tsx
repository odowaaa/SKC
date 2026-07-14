"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useAuth } from "@/lib/auth-client";

interface Stats {
  customers: number;
  suppliers: number;
  drivers: number;
  orders: number;
  pendingSuppliers: number;
  pendingDrivers: number;
  totalCommissionRevenue: number;
}

interface SupplierRow {
  id: string;
  businessName: string;
  status: string;
  user: { name: string; phone: string };
}

interface DriverRow {
  id: string;
  fullName: string;
  status: string;
  user: { name: string; phone: string };
}

interface CategoryRow {
  id: string;
  name: string;
  nameSo: string;
  commissionPct: number;
}

const ADMIN_ROLES = ["ADMIN", "REGIONAL_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN"];

export default function AdminPage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [newCategory, setNewCategory] = useState({ name: "", nameSo: "", slug: "", commissionPct: "5" });
  const [categoryError, setCategoryError] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
    fetch("/api/admin/suppliers").then((r) => r.json()).then((d) => setSuppliers(d.suppliers ?? []));
    fetch("/api/admin/drivers").then((r) => r.json()).then((d) => setDrivers(d.drivers ?? []));
    fetch("/api/admin/categories").then((r) => r.json()).then((d) => setCategories(d.categories ?? []));
  }

  useEffect(() => {
    if (user && ADMIN_ROLES.includes(user.role)) load();
  }, [user]);

  if (loading) return <div className="p-8 text-sm text-slate-500">{t("common.loading")}</div>;
  if (!user || !ADMIN_ROLES.includes(user.role)) return <div className="p-8 text-sm text-slate-500">Access denied.</div>;

  async function approveSupplier(id: string, approve: boolean) {
    await fetch(`/api/admin/suppliers/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approve }),
    });
    load();
  }

  async function approveDriver(id: string, approve: boolean) {
    await fetch(`/api/admin/drivers/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approve }),
    });
    load();
  }

  async function updateCommission(id: string, commissionPct: number) {
    await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commissionPct }),
    });
    load();
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    setCategoryError(null);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newCategory.name,
        nameSo: newCategory.nameSo,
        slug: newCategory.slug,
        commissionPct: parseFloat(newCategory.commissionPct) || 0,
      }),
    });
    const d = await res.json();
    if (res.ok) {
      setNewCategory({ name: "", nameSo: "", slug: "", commissionPct: "5" });
      load();
    } else {
      setCategoryError(d.error);
    }
  }

  const pendingSuppliers = suppliers.filter((s) => s.status === "PENDING");
  const pendingDrivers = drivers.filter((d) => d.status === "PENDING");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">{t("admin.title")}</h1>

      {stats && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Customers" value={stats.customers} />
          <StatCard label="Suppliers" value={stats.suppliers} />
          <StatCard label="Drivers" value={stats.drivers} />
          <StatCard label="Orders" value={stats.orders} />
          <StatCard label="Pending Suppliers" value={stats.pendingSuppliers} />
          <StatCard label="Pending Drivers" value={stats.pendingDrivers} />
          <StatCard label="Commission Revenue" value={`$${stats.totalCommissionRevenue.toFixed(2)}`} />
        </div>
      )}

      <h2 className="mb-3 mt-8 text-lg font-bold text-slate-800">{t("admin.pendingSuppliers")}</h2>
      <div className="space-y-2">
        {pendingSuppliers.length === 0 && <p className="text-sm text-slate-500">-</p>}
        {pendingSuppliers.map((s) => (
          <div key={s.id} className="card flex items-center justify-between p-3">
            <div>
              <p className="text-sm font-medium">{s.businessName}</p>
              <p className="text-xs text-slate-500">
                {s.user.name} &middot; {s.user.phone}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary px-2 py-1 text-xs" onClick={() => approveSupplier(s.id, true)}>
                {t("admin.approve")}
              </button>
              <button className="btn-outline px-2 py-1 text-xs" onClick={() => approveSupplier(s.id, false)}>
                {t("admin.reject")}
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold text-slate-800">{t("admin.pendingDrivers")}</h2>
      <div className="space-y-2">
        {pendingDrivers.length === 0 && <p className="text-sm text-slate-500">-</p>}
        {pendingDrivers.map((d) => (
          <div key={d.id} className="card flex items-center justify-between p-3">
            <div>
              <p className="text-sm font-medium">{d.fullName}</p>
              <p className="text-xs text-slate-500">
                {d.user.name} &middot; {d.user.phone}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary px-2 py-1 text-xs" onClick={() => approveDriver(d.id, true)}>
                {t("admin.approve")}
              </button>
              <button className="btn-outline px-2 py-1 text-xs" onClick={() => approveDriver(d.id, false)}>
                {t("admin.reject")}
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold text-slate-800">{t("admin.categories")}</h2>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Category</th>
              <th className="p-3">Commission %</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="p-3">
                  {c.name} / {c.nameSo}
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    step="0.1"
                    defaultValue={c.commissionPct}
                    className="input w-24"
                    onBlur={(e) => updateCommission(c.id, parseFloat(e.target.value))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {user.role === "ADMIN" && (
        <form onSubmit={addCategory} className="card mt-3 flex flex-wrap items-end gap-3 p-4">
          <div>
            <label className="label">Name (English)</label>
            <input
              className="input w-40"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Magaca (Somali)</label>
            <input
              className="input w-40"
              value={newCategory.nameSo}
              onChange={(e) => setNewCategory({ ...newCategory, nameSo: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Slug</label>
            <input
              className="input w-32"
              placeholder="e.g. toys"
              value={newCategory.slug}
              onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Commission %</label>
            <input
              className="input w-24"
              type="number"
              step="0.1"
              value={newCategory.commissionPct}
              onChange={(e) => setNewCategory({ ...newCategory, commissionPct: e.target.value })}
              required
            />
          </div>
          <button className="btn-primary">New Category</button>
          {categoryError && <p className="w-full text-sm text-red-600">{categoryError}</p>}
        </form>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-primary">{value}</p>
    </div>
  );
}
