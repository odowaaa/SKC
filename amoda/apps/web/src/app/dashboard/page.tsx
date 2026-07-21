"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";

export default function DashboardOverviewPage() {
  const user = useAuthStore((state) => state.user);
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user.firstName}</h1>
        <p className="text-muted-foreground">Here&apos;s a quick summary of your AMODA account.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Account role</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">{user.role.replace(/_/g, " ")}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Email</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium">{user.email}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Member ID</CardTitle>
          </CardHeader>
          <CardContent className="truncate text-xs font-mono text-muted-foreground">{user.id}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick links</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <a href="/dashboard/favorites" className="rounded-lg border border-border p-4 hover:bg-muted">
            <p className="font-medium">Saved properties</p>
            <p className="text-sm text-muted-foreground">View and manage your favorites</p>
          </a>
          <a href="/dashboard/bookings" className="rounded-lg border border-border p-4 hover:bg-muted">
            <p className="font-medium">Scheduled viewings</p>
            <p className="text-sm text-muted-foreground">Track upcoming property visits</p>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
