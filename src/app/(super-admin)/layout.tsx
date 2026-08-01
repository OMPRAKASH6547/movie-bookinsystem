"use client";

import {
  LayoutDashboard,
  Building,
  CreditCard,
  Flag,
  LifeBuoy,
  Activity,
  Percent,
  UserPlus,
  Clapperboard,
  LineChart,
} from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/layout/header";

const NAV = [
  { href: "/super-admin", label: "Platform", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/super-admin/owners", label: "Theater owners", icon: <UserPlus className="h-4 w-4" /> },
  { href: "/super-admin/theatres", label: "All theatres", icon: <Clapperboard className="h-4 w-4" /> },
  { href: "/super-admin/revenue", label: "Platform revenue", icon: <LineChart className="h-4 w-4" /> },
  { href: "/super-admin/tenants", label: "Tenants", icon: <Building className="h-4 w-4" /> },
  { href: "/super-admin/plans", label: "Plans", icon: <CreditCard className="h-4 w-4" /> },
  { href: "/super-admin/commission", label: "Commission", icon: <Percent className="h-4 w-4" /> },
  { href: "/super-admin/flags", label: "Feature flags", icon: <Flag className="h-4 w-4" /> },
  { href: "/super-admin/support", label: "Support", icon: <LifeBuoy className="h-4 w-4" /> },
  { href: "/super-admin/monitoring", label: "Monitoring", icon: <Activity className="h-4 w-4" /> },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col">
      <div className="lg:hidden">
        <Header />
      </div>
      <div className="flex flex-1">
        <DashboardSidebar items={NAV} title="Super Admin" />
        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
