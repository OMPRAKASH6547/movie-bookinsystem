"use client";

import {
  LayoutDashboard,
  Film,
  Building2,
  Users,
  Ticket,
  Tag,
  BarChart3,
  Settings,
  ScrollText,
  Image as ImageIcon,
} from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/layout/header";
import { MobileDashMenu } from "@/components/layout/mobile-bottom-nav";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/admin/movies", label: "Movies", icon: <Film className="h-4 w-4" /> },
  { href: "/admin/theatres", label: "Theatres", icon: <Building2 className="h-4 w-4" /> },
  { href: "/admin/bookings", label: "Bookings", icon: <Ticket className="h-4 w-4" /> },
  { href: "/admin/users", label: "Users", icon: <Users className="h-4 w-4" /> },
  { href: "/admin/coupons", label: "Coupons", icon: <Tag className="h-4 w-4" /> },
  { href: "/admin/banners", label: "Banners", icon: <ImageIcon className="h-4 w-4" /> },
  { href: "/admin/analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { href: "/admin/audit", label: "Audit logs", icon: <ScrollText className="h-4 w-4" /> },
  { href: "/admin/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col">
      <div className="lg:hidden">
        <Header />
        <MobileDashMenu items={NAV} />
      </div>
      <div className="flex flex-1">
        <DashboardSidebar items={NAV} title="Admin" />
        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
