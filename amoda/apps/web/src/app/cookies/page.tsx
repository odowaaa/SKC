import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      updatedAt="July 2026"
      sections={[
        {
          heading: "1. What are cookies",
          body: "Cookies are small text files stored on your device that help us keep you signed in and understand how AMODA is used.",
        },
        {
          heading: "2. Cookies we use",
          body: "Essential cookies (session and authentication), preference cookies (theme, language), and analytics cookies (aggregated usage statistics).",
        },
        {
          heading: "3. Managing cookies",
          body: "You can control cookies through your browser settings. Disabling essential cookies may prevent you from logging in or using certain features.",
        },
      ]}
    />
  );
}
