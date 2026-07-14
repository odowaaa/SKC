"use client";

import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { AuthProvider } from "@/lib/auth-client";
import { FavoritesProvider } from "@/lib/favorites-client";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <FavoritesProvider>{children}</FavoritesProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
