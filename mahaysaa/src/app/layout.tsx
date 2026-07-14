import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "MAHAYSAA - Mahaysaa? Somalia's Local Marketplace",
  description:
    "MAHAYSAA connects shops, suppliers, and delivery drivers across Somalia into one trusted marketplace.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="so">
      <body>
        <Providers>
          <Header />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
          <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
            MAHAYSAA &mdash; Soomaaliya, {new Date().getFullYear()}
          </footer>
        </Providers>
      </body>
    </html>
  );
}
