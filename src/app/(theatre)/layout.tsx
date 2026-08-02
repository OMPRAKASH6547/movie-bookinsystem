"use client";

import { useMemo } from "react";
import {
  LayoutDashboard,
  Clapperboard,
  Armchair,
  CalendarClock,
  Users,
  BarChart3,
  IndianRupee,
  Building2,
  Film,
  MonitorSmartphone,
  ScanLine,
  FileSpreadsheet,
  Wallet,
  Activity,
  Trophy,
  UserRoundSearch,
  Tag,
  Receipt,
  Landmark,
} from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/layout/header";
import { MobileDashMenu } from "@/components/layout/mobile-bottom-nav";
import { TheatrePermissionGate } from "@/components/auth/permission-gate";
import { useAuthStore } from "@/stores/auth.store";
import { filterTheatreNav, type TheatreNavKey } from "@/lib/theatre/nav";
import { ROLES } from "@/constants/roles";

const ICONS: Record<TheatreNavKey, React.ReactNode> = {
  overview: <LayoutDashboard className="h-4 w-4" />,
  theatres: <Building2 className="h-4 w-4" />,
  screens: <Clapperboard className="h-4 w-4" />,
  seats: <Armchair className="h-4 w-4" />,
  movies: <Film className="h-4 w-4" />,
  shows: <CalendarClock className="h-4 w-4" />,
  pricing: <IndianRupee className="h-4 w-4" />,
  pos: <MonitorSmartphone className="h-4 w-4" />,
  customers: <UserRoundSearch className="h-4 w-4" />,
  verify: <ScanLine className="h-4 w-4" />,
  staff: <Users className="h-4 w-4" />,
  performance: <Trophy className="h-4 w-4" />,
  activity: <Activity className="h-4 w-4" />,
  revenue: <BarChart3 className="h-4 w-4" />,
  reports: <FileSpreadsheet className="h-4 w-4" />,
  finance: <Wallet className="h-4 w-4" />,
  promotions: <Tag className="h-4 w-4" />,
  counter_sales: <Receipt className="h-4 w-4" />,
  collection: <Landmark className="h-4 w-4" />,
  analytics: <BarChart3 className="h-4 w-4" />,
};

export default function TheatreLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);

  const nav = useMemo(() => {
    const items = filterTheatreNav(user?.permissions, user?.role);
    return items.map((item) => ({
      href: item.href,
      label: item.label,
      icon: ICONS[item.key],
      exact: item.exact,
    }));
  }, [user?.permissions, user?.role]);

  const title =
    user?.role === ROLES.THEATRE_OWNER
      ? "Theatre Owner"
      : user?.role === ROLES.COUNTER_STAFF
        ? "Counter Staff"
        : user?.role === ROLES.TICKET_CHECKER
          ? "Ticket Checker"
          : user?.role === ROLES.ACCOUNTANT
            ? "Finance"
            : user?.role === ROLES.MANAGER
              ? "Manager"
              : "Theatre";

  return (
    <div className="min-h-svh flex flex-col">
      <div className="lg:hidden">
        <Header />
        <MobileDashMenu items={nav} />
      </div>
      <div className="flex flex-1">
        <DashboardSidebar items={nav} title={title} />
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <TheatrePermissionGate>{children}</TheatrePermissionGate>
        </main>
      </div>
    </div>
  );
}
