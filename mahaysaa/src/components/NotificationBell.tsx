"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

interface NotificationRow {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const { locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  function load() {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications ?? []));
  }

  useEffect(() => {
    if (!user) return;
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-600"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 max-h-96 w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">{locale === "so" ? "Wax ogeysiis ah lama helin." : "No notifications."}</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`block w-full border-b border-slate-100 p-3 text-left text-sm last:border-0 ${
                  n.read ? "bg-white" : "bg-primary/5"
                }`}
              >
                <p className="font-semibold text-slate-800">{n.title}</p>
                <p className="text-xs text-slate-500">{n.body}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
