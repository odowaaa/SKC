"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useAuth } from "@/lib/auth-client";

interface Job {
  id: string;
  status: string;
  fee: number;
  distanceFromDriverKm?: number | null;
  order: { supplier: { businessName: string }; deliveryAddress?: string | null };
}

interface DriverData {
  id: string;
  status: string;
  isAvailable: boolean;
  earnings: { netEarning: number; commissionAmount: number }[];
}

export default function DriverDashboard() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [driver, setDriver] = useState<DriverData | null>(null);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [openJobs, setOpenJobs] = useState<Job[]>([]);
  const [totals, setTotals] = useState({ totalNet: 0, totalCommission: 0 });

  function load() {
    fetch("/api/drivers/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.driver) {
          setDriver(d.driver);
          setTotals(d.totals);
        }
      });
    fetch("/api/deliveries")
      .then((r) => r.json())
      .then((d) => {
        setMyJobs(d.myJobs ?? []);
        setOpenJobs(d.openJobs ?? []);
      });
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  if (loading) return <div className="p-8 text-sm text-slate-500">{t("common.loading")}</div>;
  if (!user || user.role !== "DRIVER") return <div className="p-8 text-sm text-slate-500">Access denied.</div>;
  if (!driver) return <div className="p-8 text-sm text-slate-500">{t("common.loading")}</div>;

  if (driver.status !== "APPROVED") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="card p-8">
          <p className="text-2xl">⏳</p>
          <h1 className="mt-2 text-lg font-bold text-slate-900">{t("supplier.register.pending")}</h1>
        </div>
      </div>
    );
  }

  async function toggleAvailable() {
    await fetch("/api/drivers/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !driver!.isAvailable }),
    });
    load();
  }

  async function claimJob(id: string) {
    const res = await fetch(`/api/deliveries/${id}/assign`, { method: "POST" });
    if (res.ok) load();
  }

  async function completeJob(id: string) {
    const res = await fetch(`/api/deliveries/${id}/complete`, { method: "POST" });
    if (res.ok) load();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
        <button onClick={toggleAvailable} className={driver.isAvailable ? "btn-secondary" : "btn-outline"}>
          {t("dashboard.driver.available")}: {driver.isAvailable ? "ON" : "OFF"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs text-slate-500">{t("dashboard.driver.income")}</p>
          <p className="text-xl font-bold text-primary">${totals.totalNet.toFixed(2)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">Commission Paid</p>
          <p className="text-xl font-bold text-accent-600">${totals.totalCommission.toFixed(2)}</p>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold text-slate-800">My Deliveries</h2>
      <div className="space-y-2">
        {myJobs.length === 0 && <p className="text-sm text-slate-500">-</p>}
        {myJobs.map((j) => (
          <div key={j.id} className="card flex items-center justify-between p-3">
            <div>
              <p className="text-sm font-medium">{j.order.supplier.businessName}</p>
              <p className="text-xs text-slate-500">{j.order.deliveryAddress}</p>
              <span className="badge bg-primary/10 text-primary">{j.status}</span>
            </div>
            <div className="text-right">
              <p className="font-bold">${j.fee.toFixed(2)}</p>
              {j.status !== "DELIVERED" && (
                <button onClick={() => completeJob(j.id)} className="btn-secondary mt-1 px-2 py-1 text-xs">
                  Mark Delivered
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold text-slate-800">{t("dashboard.driver.jobs")}</h2>
      <div className="space-y-2">
        {openJobs.length === 0 && <p className="text-sm text-slate-500">-</p>}
        {openJobs.map((j) => (
          <div key={j.id} className="card flex items-center justify-between p-3">
            <div>
              <p className="text-sm font-medium">{j.order.supplier.businessName}</p>
              {j.distanceFromDriverKm != null && (
                <p className="text-xs text-slate-500">{j.distanceFromDriverKm.toFixed(1)} km away</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold">${j.fee.toFixed(2)}</p>
              <button onClick={() => claimJob(j.id)} className="btn-primary mt-1 px-2 py-1 text-xs">
                Accept
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
