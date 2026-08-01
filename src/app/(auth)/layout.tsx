import Link from "next/link";
import { Ticket } from "lucide-react";
import { APP_NAME } from "@/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between p-10 bg-secondary text-secondary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(225,29,72,0.35),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(245,197,24,0.15),transparent_45%)]" />
        <Link href="/" className="relative flex items-center gap-2 z-10">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Ticket className="h-5 w-5" />
          </span>
          <span className="font-display text-2xl">{APP_NAME}</span>
        </Link>
        <div className="relative z-10">
          <p className="font-display text-4xl xl:text-5xl leading-tight mb-4">
            Lights. Camera. Your seat.
          </p>
          <p className="text-secondary-foreground/70 max-w-md">
            Secure login with refresh-token rotation, multi-device sessions, and role-based access.
          </p>
        </div>
        <p className="relative z-10 text-xs text-secondary-foreground/50">
          Enterprise-grade authentication · JWT · RBAC · OTP
        </p>
      </div>
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
