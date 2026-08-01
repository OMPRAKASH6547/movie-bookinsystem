"use client";

import {
  LayoutDashboard,
  Ticket,
  Heart,
  Wallet,
  User,
  Bell,
  HelpCircle,
} from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/layout/header";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/bookings", label: "My bookings", icon: <Ticket className="h-4 w-4" /> },
  { href: "/wishlist", label: "Wishlist", icon: <Heart className="h-4 w-4" /> },
  { href: "/wallet", label: "Wallet", icon: <Wallet className="h-4 w-4" /> },
  { href: "/profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  { href: "/dashboard#notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { href: "/#faq", label: "Help center", icon: <HelpCircle className="h-4 w-4" /> },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col">
      <div className="lg:hidden">
        <Header />
      </div>
      <div className="flex flex-1">
        <DashboardSidebar items={NAV} title="Customer" />
        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
