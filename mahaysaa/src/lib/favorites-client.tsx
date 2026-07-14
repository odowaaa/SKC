"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-client";

interface FavoritesContextValue {
  favoriteIds: Set<string>;
  toggle: (productId: string) => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "CUSTOMER") {
      setFavoriteIds(new Set());
      return;
    }
    setLoading(true);
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => {
        const ids = (d.favorites ?? []).map((f: { productId: string }) => f.productId);
        setFavoriteIds(new Set(ids));
      })
      .finally(() => setLoading(false));
  }, [user]);

  const toggle = useCallback(
    async (productId: string) => {
      if (!user || user.role !== "CUSTOMER") return;
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.has(productId) ? next.delete(productId) : next.add(productId);
        return next;
      });
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        const data = await res.json();
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          data.favorited ? next.add(productId) : next.delete(productId);
          return next;
        });
      }
    },
    [user]
  );

  return (
    <FavoritesContext.Provider value={{ favoriteIds, toggle, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider");
  return ctx;
}
