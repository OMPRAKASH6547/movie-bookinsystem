"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/constants";
import { cn } from "@/utils/cn";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "cinepass-install-dismissed";

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIos());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const canInstall = !installed && (!!deferred || ios);

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setDeferred(null);
      }
      return choice.outcome;
    }
    return null;
  };

  return { canInstall, installed, ios, install, hasNativePrompt: !!deferred };
}

/** Floating install CTA + iOS instructions */
export function InstallPrompt({ className }: { className?: string }) {
  const { canInstall, ios, install, hasNativePrompt } = usePwaInstall();
  const [open, setOpen] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (!canInstall) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(() => setOpen(true), 2500);
    return () => window.clearTimeout(t);
  }, [canInstall]);

  if (!canInstall || !open) return null;

  const dismiss = () => {
    setOpen(false);
    setShowIosHelp(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const onInstall = async () => {
    if (ios && !hasNativePrompt) {
      setShowIosHelp(true);
      return;
    }
    await install();
    dismiss();
  };

  return (
    <div
      className={cn(
        "fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] z-[60] md:inset-x-auto md:right-4 md:bottom-4 md:w-[22rem]",
        className
      )}
      role="dialog"
      aria-label={`Install ${APP_NAME}`}
    >
      <div className="rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Download className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm">Install {APP_NAME}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add to your home screen for faster booking and ticket access.
            </p>
            {showIosHelp && (
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Tap <Share className="inline h-3.5 w-3.5" /> Share, then{" "}
                <strong>Add to Home Screen</strong>.
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={onInstall}>
                {ios && !hasNativePrompt ? "How to install" : "Install app"}
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss}>
                Not now
              </Button>
            </div>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            className="text-muted-foreground hover:text-foreground"
            onClick={dismiss}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Compact button for header / landing CTAs */
export function InstallAppButton({
  className,
  variant = "outline",
  size = "sm",
  label = "Install app",
}: {
  className?: string;
  variant?: "outline" | "default" | "accent" | "ghost";
  size?: "sm" | "lg" | "default";
  label?: string;
}) {
  const { canInstall, ios, install, hasNativePrompt, installed } = usePwaInstall();
  const [hint, setHint] = useState(false);

  if (installed) return null;
  if (!canInstall && !hint) {
    // Still show a soft CTA — browsers may expose install later
  }

  return (
    <div className={cn("inline-flex flex-col items-start gap-1", className)}>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={async () => {
          if (ios && !hasNativePrompt) {
            setHint(true);
            return;
          }
          const outcome = await install();
          if (!outcome) setHint(true);
        }}
      >
        <Download className="h-4 w-4" />
        {label}
      </Button>
      {hint && (
        <p className="text-xs text-muted-foreground max-w-xs">
          {ios ? (
            <>
              Tap Share <Share className="inline h-3 w-3" />, then Add to Home Screen.
            </>
          ) : (
            <>Use your browser menu → Install app / Add to Home screen.</>
          )}
        </p>
      )}
    </div>
  );
}

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* ignore registration failures in dev */
    });
  });
}
