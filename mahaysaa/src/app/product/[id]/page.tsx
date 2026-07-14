"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useAuth } from "@/lib/auth-client";

interface ProductDetail {
  id: string;
  name: string;
  nameSo?: string | null;
  description?: string | null;
  price: number;
  discountPct: number;
  stock: number;
  brand?: string | null;
  condition: string;
  supplier: { id: string; businessName: string; city: string; whatsapp?: string | null; ratingAvg: number };
  category: { name: string; nameSo: string };
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("CASH_ON_DELIVERY");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => setProduct(d.product));
  }, [id]);

  if (!product) return <div className="p-8 text-sm text-slate-500">{t("common.loading")}</div>;

  const displayName = (locale === "so" && product.nameSo) || product.name;
  const finalPrice =
    product.discountPct > 0 ? Math.round(product.price * (1 - product.discountPct / 100) * 100) / 100 : product.price;

  async function getReferralCode() {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (user.role !== "CUSTOMER") {
      setMessage(locale === "so" ? "Koodhka xawaaladda waxaa heli kara macaamiisha oo kaliya." : "Only customers can request a referral code.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierId: product!.supplier.id, productId: product!.id }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) setReferralCode(data.referralCode.code);
    else setMessage(data.error);
  }

  async function placeOrder() {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product!.id,
        quantity,
        paymentMethod,
        deliveryAddress: address,
        referralCode: referralCode ?? undefined,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setOrderPlaced(true);
    } else {
      setMessage(data.error);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex h-72 items-center justify-center rounded-xl bg-slate-100 text-6xl">📦</div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-600">
            {locale === "so" ? product.category.nameSo : product.category.name}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{displayName}</h1>
          <Link href={`/supplier/${product.supplier.id}`} className="mt-1 inline-block text-sm text-primary">
            {t("product.supplier")}: {product.supplier.businessName}
          </Link>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-2xl font-bold text-primary">
              {t("common.currency")}
              {finalPrice.toFixed(2)}
            </span>
            {product.discountPct > 0 && (
              <span className="text-slate-400 line-through">
                {t("common.currency")}
                {product.price.toFixed(2)}
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-slate-500">
            {product.stock > 0 ? `${t("product.stock")}: ${product.stock}` : t("product.outOfStock")}
          </p>

          {product.description && <p className="mt-4 text-sm text-slate-700">{product.description}</p>}

          {message && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}

          {!orderPlaced ? (
            <div className="mt-6 space-y-4 rounded-xl border border-slate-200 p-4">
              {referralCode ? (
                <div className="rounded-lg bg-secondary-50 p-3">
                  <p className="text-xs font-semibold text-secondary-600">{t("referral.title")}</p>
                  <p className="mt-1 text-lg font-bold tracking-wide text-secondary-600">{referralCode}</p>
                  <p className="mt-1 text-xs text-slate-500">{t("referral.explain")}</p>
                </div>
              ) : (
                <button className="btn-outline w-full" onClick={getReferralCode} disabled={busy}>
                  {t("product.getReferralCode")}
                </button>
              )}

              <div className="flex items-center gap-3">
                <label className="label mb-0">Qty</label>
                <input
                  type="number"
                  min={1}
                  max={product.stock}
                  className="input w-24"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

              <div>
                <label className="label">{locale === "so" ? "Habka Bixinta" : "Payment Method"}</label>
                <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                  <option value="EVC_PLUS">EVC Plus</option>
                  <option value="ZAAD">Zaad</option>
                  <option value="SAHAL">Sahal</option>
                  <option value="EDAHAB">eDahab</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="label">{locale === "so" ? "Cinwaanka Gaarsiinta" : "Delivery Address"}</label>
                <input
                  className="input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={locale === "so" ? "Degmada, xaafadda..." : "District, neighborhood..."}
                />
              </div>

              <button className="btn-primary w-full" onClick={placeOrder} disabled={busy || product.stock === 0}>
                {t("product.addToOrder")}
              </button>
            </div>
          ) : (
            <div className="mt-6 rounded-xl bg-secondary-50 p-4 text-secondary-600">
              <p className="font-semibold">{t("order.placed")}</p>
              <Link href="/dashboard/customer" className="mt-2 inline-block text-sm underline">
                {t("dashboard.customer.orders")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
