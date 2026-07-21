"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Bookmark,
  Building2,
  Calendar,
  FileText,
  HandCoins,
  Heart,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Shield,
  User,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

const LISTING_ROLES = ["AGENT", "OWNER", "DEVELOPER", "SUPER_ADMIN", "ADMIN", "REGIONAL_MANAGER", "BRANCH_MANAGER", "PROPERTY_MANAGER"];
const LEAD_ROLES = ["AGENT", "SUPER_ADMIN", "ADMIN", "REGIONAL_MANAGER", "BRANCH_MANAGER", "MARKETING_MANAGER"];
const LEASE_ROLES = ["OWNER", "TENANT", "SUPER_ADMIN", "ADMIN", "PROPERTY_MANAGER", "ACCOUNTANT"];
const OFFER_ROLES = ["AGENT", "SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "ACCOUNTANT"];
const APPOINTMENT_ROLES = ["AGENT"];
const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];
const CONTENT_ROLES = ["SUPER_ADMIN", "ADMIN", "MARKETING_MANAGER"];

function navItemsFor(role: string) {
  const items = [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard }];

  if (LISTING_ROLES.includes(role)) {
    items.push({ href: "/dashboard/properties", label: "Properties", icon: Building2 });
  }
  if (LEAD_ROLES.includes(role)) {
    items.push({ href: "/dashboard/leads", label: "Leads", icon: Users });
  }
  if (OFFER_ROLES.includes(role)) {
    items.push({ href: "/dashboard/offers", label: "Offers", icon: HandCoins });
  }
  if (APPOINTMENT_ROLES.includes(role)) {
    items.push({ href: "/dashboard/appointments", label: "Appointments", icon: Calendar });
  }
  if (LEASE_ROLES.includes(role)) {
    items.push({ href: "/dashboard/leases", label: "Leases", icon: ScrollText });
  }

  items.push({ href: "/dashboard/favorites", label: "Favorites", icon: Heart });
  items.push({ href: "/dashboard/saved-searches", label: "Saved Searches", icon: Bookmark });
  items.push({ href: "/dashboard/bookings", label: "My Viewings", icon: Calendar });
  items.push({ href: "/dashboard/security", label: "Security", icon: Shield });

  if (ADMIN_ROLES.includes(role)) {
    items.push({ href: "/dashboard/admin/users", label: "Users", icon: Shield });
  }
  if (CONTENT_ROLES.includes(role)) {
    items.push({ href: "/dashboard/admin/blog", label: "Blog", icon: FileText });
  }

  return items;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  if (!user) return null;

  const navItems = navItemsFor(user.role);

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-1">
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{user.role.replace(/_/g, " ")}</p>
          </div>
        </div>

        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted",
              pathname === item.href && "bg-muted",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}

        <button
          onClick={() => {
            clear();
            router.push("/");
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </aside>

      <div>{children}</div>
    </div>
  );
}
