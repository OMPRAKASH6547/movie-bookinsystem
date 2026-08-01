"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth.store";
import { APP_NAME } from "@/constants";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      const res = await api.post("/auth/register", data);
      setAuth(res.data.data.user, res.data.data.accessToken);
      toast.success("Account created! ₹100 wallet bonus added.");
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Registration failed. Ensure MongoDB is running."
      );
    }
  };

  return (
    <div>
      <Link href="/" className="lg:hidden font-display text-2xl mb-8 block">
        {APP_NAME}
      </Link>
      <h1 className="font-display text-3xl mb-2">Join {APP_NAME}</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Create your account and get wallet credits
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" autoComplete="name" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" placeholder="+919876543210" {...register("phone")} />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            8+ chars with upper, lower, and a number
          </p>
        </div>
        <Button
          type="submit"
          className="w-full"
          loading={isSubmitting}
          loadingText="Creating…"
        >
          Create account
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
