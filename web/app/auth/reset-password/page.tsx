"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validations/auth";
import { authClient } from "@/lib/auth-client";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrengthIndicator } from "@/components/auth/password-strength";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const watchPassword = watch("password", "");

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!token) {
      toast.error("Invalid reset link. Please request a new one.");
      return;
    }

    setIsLoading(true);
    try {
      await authClient.resetPassword({
        newPassword: values.password,
        token,
      });
      toast.success("Password updated successfully!");
      router.push("/auth/signin");
    } catch {
      toast.error("Failed to reset password. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthCard
        title="Invalid reset link"
        subtitle="This password reset link is invalid or has expired."
      >
        <div className="text-center py-4">
          <a
            href="/auth/forgot-password"
            className={cn(
              "inline-flex items-center justify-center gap-2",
              "py-3 px-6 rounded-[var(--radius-sm)]",
              "bg-surface-dark text-white font-bold text-body",
              "transition-all duration-200",
              "hover:opacity-90 active:scale-[0.98]"
            )}
          >
            Request a new link
          </a>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your new password below."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* New Password */}
        <div>
          <PasswordInput
            label="New Password"
            placeholder="Enter your new password"
            autoComplete="new-password"
            error={errors.password?.message}
            registration={register("password")}
          />
          <PasswordStrengthIndicator password={watchPassword} />
        </div>

        {/* Confirm Password */}
        <PasswordInput
          label="Confirm Password"
          placeholder="Re-enter your new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          registration={register("confirmPassword")}
        />

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
          Reset Password
        </button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-surface-dark" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
