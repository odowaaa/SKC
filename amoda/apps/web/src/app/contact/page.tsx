import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Contact AMODA",
  description: "Get in touch with the AMODA team for support, partnerships, or listing inquiries.",
};

export default function ContactPage() {
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold">Contact us</h1>
        <p className="mt-4 text-muted-foreground">
          Have a question about a listing, need support with your account, or want to partner with AMODA? Reach
          out — our team typically responds within one business day.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <Mail className="h-5 w-5 text-secondary" />
              <div>
                <p className="text-sm font-semibold">Email</p>
                <p className="text-sm text-muted-foreground">support@amoda.app</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <Phone className="h-5 w-5 text-secondary" />
              <div>
                <p className="text-sm font-semibold">Phone</p>
                <p className="text-sm text-muted-foreground">+252 61 000 0000</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <MapPin className="h-5 w-5 text-secondary" />
              <div>
                <p className="text-sm font-semibold">Office</p>
                <p className="text-sm text-muted-foreground">Airport Road, Mogadishu, Somalia</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
