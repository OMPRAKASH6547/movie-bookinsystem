"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";

function VerifyInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "ok" | "fail">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("fail");
      return;
    }
    api
      .get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => setStatus("ok"))
      .catch(() => setStatus("fail"));
  }, [token]);

  return (
    <div className="text-center space-y-4">
      <h1 className="font-display text-3xl">Email verification</h1>
      {status === "loading" && <p className="text-muted-foreground">Verifying…</p>}
      {status === "ok" && (
        <>
          <p className="text-emerald-500 font-medium">Email verified successfully.</p>
          <Button asChild>
            <Link href="/login">Continue to sign in</Link>
          </Button>
        </>
      )}
      {status === "fail" && (
        <>
          <p className="text-destructive">Invalid or expired verification link.</p>
          <Button variant="outline" asChild>
            <Link href="/login">Back to sign in</Link>
          </Button>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <VerifyInner />
    </Suspense>
  );
}
