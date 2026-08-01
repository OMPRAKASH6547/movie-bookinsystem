"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth.store";
import { APP_NAME } from "@/constants";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [otpMode, setOtpMode] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: true },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      const res = await api.post("/auth/login", data);
      setAuth(res.data.data.user, res.data.data.accessToken);
      toast.success("Welcome back!");
      const loggedIn = res.data.data.user;
      const role = loggedIn.role;
      if (role === "super_admin") router.push("/super-admin");
      else if (role === "admin") router.push("/admin");
      else if (
        role === "theatre_owner" ||
        role === "manager" ||
        role === "counter_staff" ||
        role === "ticket_checker" ||
        role === "accountant" ||
        role === "marketing" ||
        role === "employee"
      ) {
        const { defaultTheatreLanding } = await import("@/lib/theatre/nav");
        router.push(defaultTheatreLanding(loggedIn.permissions, role));
      } else router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Login failed. Use seed accounts or register.";
      toast.error(message);
    }
  };

  const handleGuest = async () => {
    setGuestLoading(true);
    try {
      const res = await api.post("/auth/guest", {
        name: "Guest User",
        email: `guest_${Date.now()}@cinepass.app`,
      });
      setAuth(res.data.data.user, res.data.data.accessToken);
      toast.success("Continuing as guest");
      router.push("/movies");
    } catch {
      toast.error("Guest login requires MongoDB. Browse movies without login.");
      router.push("/movies");
    } finally {
      setGuestLoading(false);
    }
  };

  const handleOtp = async () => {
    setOtpLoading(true);
    try {
      if (!otpSent) {
        const res = await api.post("/auth/otp", { phone });
        setOtpSent(true);
        toast.success("OTP sent");
        if (res.data.data?.debugOtp) toast.info(`Dev OTP: ${res.data.data.debugOtp}`);
      } else {
        const res = await api.post("/auth/otp", { phone, otp });
        setAuth(res.data.data.user, res.data.data.accessToken);
        toast.success("Verified!");
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "OTP failed"
      );
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div>
      <Link href="/" className="lg:hidden font-display text-2xl mb-8 block">
        {APP_NAME}
      </Link>
      <h1 className="font-display text-3xl mb-2">Welcome back</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Sign in to book seats and manage tickets
      </p>

      {!otpMode ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("rememberMe")} className="rounded" />
            Remember me
          </label>
          <Button
            type="submit"
            className="w-full"
            loading={isSubmitting}
            loadingText="Signing in…"
          >
            Sign in
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              placeholder="+919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          {otpSent && (
            <div className="space-y-2">
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
              />
            </div>
          )}
          <Button
            type="button"
            className="w-full"
            onClick={handleOtp}
            loading={otpLoading}
            loadingText={otpSent ? "Verifying…" : "Sending…"}
          >
            {otpSent ? "Verify OTP" : "Send OTP"}
          </Button>
        </div>
      )}

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Button variant="outline" type="button" onClick={() => toast.info("Configure Google OAuth in .env")}>
          Google
        </Button>
        <Button variant="outline" type="button" onClick={() => toast.info("Configure GitHub OAuth in .env")}>
          GitHub
        </Button>
      </div>

      <div className="flex flex-col gap-2 text-sm text-center">
        <button
          type="button"
          className="text-primary hover:underline"
          onClick={() => setOtpMode(!otpMode)}
        >
          {otpMode ? "Use email & password" : "Login with OTP"}
        </button>
        <Button
          type="button"
          variant="ghost"
          className="text-muted-foreground"
          onClick={handleGuest}
          loading={guestLoading}
          loadingText="Starting guest…"
        >
          Continue as guest
        </Button>
        <p className="text-muted-foreground pt-2">
          New here?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
