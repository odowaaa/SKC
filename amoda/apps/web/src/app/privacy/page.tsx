import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updatedAt="July 2026"
      sections={[
        {
          heading: "1. Information we collect",
          body: "We collect account information (name, email, phone), property listing details, booking and payment records, and usage data to operate and improve AMODA.",
        },
        {
          heading: "2. How we use your information",
          body: "We use your information to provide search and listing services, process bookings and payments, send transactional notifications, and prevent fraud.",
        },
        {
          heading: "3. Sharing of information",
          body: "We share information with agents and owners you contact through the platform, payment processors required to complete transactions, and service providers who help us operate AMODA. We do not sell your personal data.",
        },
        {
          heading: "4. Data security",
          body: "Passwords are hashed with Argon2, sessions use short-lived JWTs with rotating refresh tokens, and access to production data is restricted and logged.",
        },
        {
          heading: "5. Your rights",
          body: "You may request access to, correction of, or deletion of your personal data at any time by contacting support@amoda.app.",
        },
      ]}
    />
  );
}
