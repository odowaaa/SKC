"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";
import { useAuth } from "@/lib/auth-client";

export function Header() {
  const { t, locale, setLocale } = useTranslation();
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardHref =
    user?.role === "SUPPLIER"
      ? "/dashboard/supplier"
      : user?.role === "DRIVER"
      ? "/dashboard/driver"
      : user?.role && user.role !== "CUSTOMER"
      ? "/admin"
      : "/dashboard/customer";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">
            M
          </span>
          <span className="text-lg font-bold text-primary">{t("app.name")}</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 md:flex">
          <Link href="/" className="hover:text-primary">
            {t("nav.home")}
          </Link>
          <Link href="/search" className="hover:text-primary">
            {t("nav.search")}
          </Link>
          <Link href="/supplier/register" className="hover:text-primary">
            {t("nav.becomeSupplier")}
          </Link>
          <Link href="/driver/register" className="hover:text-primary">
            {t("nav.becomeDriver")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-full border border-slate-300 text-xs font-semibold">
            <button
              onClick={() => setLocale("so")}
              className={`px-2.5 py-1 ${locale === "so" ? "bg-primary text-white" : "text-slate-600"}`}
            >
              SO
            </button>
            <button
              onClick={() => setLocale("en")}
              className={`px-2.5 py-1 ${locale === "en" ? "bg-primary text-white" : "text-slate-600"}`}
            >
              EN
            </button>
          </div>

          {!loading && !user && (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/auth/login" className="btn-outline px-3 py-1.5 text-sm">
                {t("nav.login")}
              </Link>
              <Link href="/auth/register" className="btn-primary px-3 py-1.5 text-sm">
                {t("nav.register")}
              </Link>
            </div>
          )}

          {!loading && user && (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href={dashboardHref} className="btn-outline px-3 py-1.5 text-sm">
                {t("nav.dashboard")}
              </Link>
              <button onClick={logout} className="btn-outline px-3 py-1.5 text-sm">
                {t("nav.logout")}
              </button>
            </div>
          )}

          <button
            className="rounded-lg border border-slate-300 p-2 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 6h18M3 12h18M3 18h18" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium text-slate-700">
            <Link href="/" onClick={() => setMenuOpen(false)}>
              {t("nav.home")}
            </Link>
            <Link href="/search" onClick={() => setMenuOpen(false)}>
              {t("nav.search")}
            </Link>
            <Link href="/supplier/register" onClick={() => setMenuOpen(false)}>
              {t("nav.becomeSupplier")}
            </Link>
            <Link href="/driver/register" onClick={() => setMenuOpen(false)}>
              {t("nav.becomeDriver")}
            </Link>
            {user ? (
              <>
                <Link href={dashboardHref} onClick={() => setMenuOpen(false)}>
                  {t("nav.dashboard")}
                </Link>
                <button className="text-left" onClick={logout}>
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
                  {t("nav.login")}
                </Link>
                <Link href="/auth/register" onClick={() => setMenuOpen(false)}>
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
