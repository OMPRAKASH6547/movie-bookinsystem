"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import { Suspense } from "react";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      toast.success("Password updated — sign in");
      router.push("/login");
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Reset failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl mb-2">Choose a new password</h1>
      <p className="text-muted-foreground text-sm mb-8">Enter the token from your email</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="token">Reset token</Label>
          <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
      <p className="text-sm text-center mt-6">
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <ResetForm />
    </Suspense>
  );
}
