"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validations/auth";
import { authClient } from "@/lib/auth-client";
import { AuthCard } from "@/components/auth/auth-card";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setIsLoading(true);
    try {
      await authClient.requestPasswordReset({
        email: values.email,
        redirectTo: "/auth/reset-password",
      });
      toast.success("Reset link sent! Check your email.");
      setEmailSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="We've sent password reset instructions to your email."
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Mail size={28} className="text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-body text-text-muted text-center">
            If an account exists with that email, you&apos;ll receive a link to
            reset your password.
          </p>
        </div>

        <p className="text-center text-body text-text-muted mt-4">
          <Link
            href="/auth/signin"
            className="font-bold text-text-dark hover:underline transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-body font-bold text-text-dark mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={cn(
              "w-full rounded-[var(--radius-sm)] border bg-bg px-4 py-3 text-body text-text-primary",
              "placeholder:text-text-muted",
              "transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-surface-dark/30 focus:border-surface-dark",
              "dark:focus:ring-white/20 dark:focus:border-white/50",
              errors.email
                ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
                : "border-border"
            )}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-[13px] text-red-500 mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "w-full flex items-center justify-center gap-2",
            "py-3 px-4 rounded-[var(--radius-sm)]",
            "bg-surface-dark text-white font-bold text-body",
            "transition-all duration-200",
            "hover:opacity-90 active:scale-[0.98]",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isLoading && <Loader2 size={18} className="animate-spin" />}
          Send Reset Link
        </button>
      </form>

      <p className="text-center text-body text-text-muted mt-6">
        <Link
          href="/auth/signin"
          className="font-bold text-text-dark hover:underline transition-colors"
        >
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
