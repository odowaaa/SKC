import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updatedAt="July 2026"
      sections={[
        {
          heading: "1. Acceptance of terms",
          body: "By creating an account or using AMODA, you agree to these Terms of Service and our Privacy Policy.",
        },
        {
          heading: "2. Listings and accuracy",
          body: "Agents, owners, and developers are responsible for the accuracy of their listings. AMODA reserves the right to remove listings that violate our content guidelines or applicable law.",
        },
        {
          heading: "3. Payments",
          body: "Transactions processed through AMODA (including via Stripe, PayPal, or supported mobile money providers) are subject to the terms of the respective payment processor in addition to these terms.",
        },
        {
          heading: "4. Account responsibilities",
          body: "You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.",
        },
        {
          heading: "5. Limitation of liability",
          body: "AMODA is a marketplace connecting buyers, renters, agents, owners, and developers. We are not a party to transactions between users and are not liable for disputes arising from them.",
        },
      ]}
    />
  );
}
