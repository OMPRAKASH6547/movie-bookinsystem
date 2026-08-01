"use client";

import {
  LayoutDashboard,
  Clapperboard,
  Armchair,
  CalendarClock,
  Users,
  BarChart3,
  IndianRupee,
} from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/layout/header";

const NAV = [
  { href: "/theatre", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/theatre/screens", label: "Screens", icon: <Clapperboard className="h-4 w-4" /> },
  { href: "/theatre/seats", label: "Seat layout", icon: <Armchair className="h-4 w-4" /> },
  { href: "/theatre/shows", label: "Shows", icon: <CalendarClock className="h-4 w-4" /> },
  { href: "/theatre/pricing", label: "Pricing", icon: <IndianRupee className="h-4 w-4" /> },
  { href: "/theatre/staff", label: "Staff", icon: <Users className="h-4 w-4" /> },
  { href: "/theatre/analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
];

export default function TheatreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col">
      <div className="lg:hidden">
        <Header />
      </div>
      <div className="flex flex-1">
        <DashboardSidebar items={NAV} title="Theatre" />
        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
