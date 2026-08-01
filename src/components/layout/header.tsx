"use client";

import Link from "next/link";
import { useState } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Menu,
  X,
  Moon,
  Sun,
  Ticket,
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth.store";
import { APP_NAME } from "@/constants";
import { api } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";

const NAV = [
  { href: "/movies", label: "Movies" },
  { href: "/movies?status=upcoming", label: "Upcoming" },
  { href: "/#offers", label: "Offers" },
  { href: "/#theatres", label: "Theatres" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/movies?search=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
    logout();
    router.push("/");
  };

  const dashHref =
    user?.role === "super_admin"
      ? "/super-admin"
      : user?.role === "admin"
        ? "/admin"
        : user?.role === "theatre_owner" || user?.role === "manager"
          ? "/theatre"
          : "/dashboard";

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Ticket className="h-5 w-5" />
          </span>
          <span className="font-display text-2xl tracking-tight group-hover:text-primary transition-colors">
            {APP_NAME}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={dashHref}>
                  <LayoutDashboard className="h-4 w-4" />
                  {user.name.split(" ")[0]}
                </Link>
              </Button>
              <Button variant="ghost" size="icon" aria-label="Logout" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">
                  <User className="h-4 w-4" />
                  Sign in
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Join free</Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <form onSubmit={handleSearch} className="container-page py-3 flex gap-2">
              <Input
                autoFocus
                placeholder="Search movies, genres, languages…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search movies"
              />
              <Button type="submit">Search</Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={cn("md:hidden overflow-hidden border-t border-border bg-background")}
          >
            <div className="container-page flex flex-col py-3 gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-3 text-sm font-medium rounded-md hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
              {!user ? (
                <>
                  <Link href="/login" className="px-3 py-3 text-sm font-medium" onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                  <Link href="/register" className="px-3 py-3 text-sm font-medium text-primary" onClick={() => setOpen(false)}>
                    Join free
                  </Link>
                </>
              ) : (
                <Link href={dashHref} className="px-3 py-3 text-sm font-medium" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
