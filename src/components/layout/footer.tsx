import Link from "next/link";
import { Ticket } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/constants";

const LINKS = {
  Discover: [
    { href: "/movies", label: "Now Showing" },
    { href: "/movies?status=upcoming", label: "Coming Soon" },
    { href: "/#cities", label: "Cities" },
    { href: "/#offers", label: "Offers" },
  ],
  Account: [
    { href: "/login", label: "Sign in" },
    { href: "/register", label: "Create account" },
    { href: "/login?next=/bookings", label: "My bookings" },
    { href: "/login?next=/wallet", label: "Wallet" },
  ],
  Support: [
    { href: "/#faq", label: "FAQ" },
    { href: "/#app", label: "Get the app" },
    { href: "mailto:support@cinepass.app", label: "Contact" },
    { href: "/api/docs", label: "API docs" },
  ],
};

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-border bg-card/50 mt-20">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Ticket className="h-5 w-5" />
              </span>
              <span className="font-display text-2xl">{APP_NAME}</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
              {APP_TAGLINE} Book cinema seats with live availability, wallet rewards, and instant QR
              tickets.
            </p>
          </div>
          {Object.entries(LINKS).map(([title, items]) => (
            <div key={title}>
              <h3 className="font-semibold mb-3 text-sm">{title}</h3>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row justify-between gap-4 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/accessibility" className="hover:text-foreground">
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
