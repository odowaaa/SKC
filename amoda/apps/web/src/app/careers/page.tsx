import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Careers", description: "Join the AMODA team." };

const OPEN_ROLES = [
  { title: "Senior Full-Stack Engineer", location: "Mogadishu / Remote", type: "Full-time" },
  { title: "Real Estate Growth Manager", location: "Hargeisa", type: "Full-time" },
  { title: "Customer Support Specialist", location: "Remote", type: "Full-time" },
];

export default function CareersPage() {
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold">Careers at AMODA</h1>
        <p className="mt-4 text-muted-foreground">
          We&apos;re building the modern property marketplace for Somalia. Join us.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-2xl space-y-4">
        {OPEN_ROLES.map((role) => (
          <Card key={role.title}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="font-semibold">{role.title}</p>
                <p className="text-sm text-muted-foreground">{role.location}</p>
              </div>
              <Badge variant="muted">{role.type}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
        Don&apos;t see a role that fits? Email your resume to{" "}
        <a href="mailto:careers@amoda.app" className="text-secondary hover:underline">
          careers@amoda.app
        </a>
        .
      </p>
    </div>
  );
}
