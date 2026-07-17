"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AuthCard } from "@/components/auth/auth-card";
import { authClient } from "@/lib/auth-client";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email") || "";
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (token && !verified) {
      setIsVerifying(true);
      authClient.verifyEmail({ query: { token } })
        .then(() => {
          setVerified(true);
          toast.success("Email verified successfully!");
        })
        .catch(() => {
          toast.error("Verification failed. The link may have expired.");
        })
        .finally(() => setIsVerifying(false));
    }
  }, [token, verified]);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await authClient.sendVerificationEmail({ email });
      toast.success("Verification email sent!");
      setCooldown(60);
    } catch {
      toast.error("Failed to resend email. Please try again.");
    } finally {
      setIsResending(false);
    }
  }, [cooldown, isResending, email]);

  if (isVerifying) {
    return (
      <AuthCard title="Verifying your email" subtitle="Please wait...">
        <div className="flex justify-center py-8">
          <Loader2 size={32} className="animate-spin text-text-muted" />
        </div>
      </AuthCard>
    );
  }

  if (verified) {
    return (
      <AuthCard
        title="Email verified!"
        subtitle="Your account is now active. You can sign in."
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <Link
            href="/auth/signin"
            className={cn(
              "w-full flex items-center justify-center gap-2",
              "py-3 px-4 rounded-[var(--radius-sm)]",
              "bg-surface-dark text-white font-bold text-body",
              "transition-all duration-200",
              "hover:opacity-90 active:scale-[0.98]"
            )}
          >
            Continue to Sign In
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Verify your email"
      subtitle={email ? `We've sent a verification link to ${email}` : "We've sent a verification link to your email address."}
    >
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Mail size={28} className="text-blue-600 dark:text-blue-400" />
        </div>

        <p className="text-body text-text-muted text-center">
          Click the link in the email to verify your account. If you don&apos;t
          see it, check your spam folder.
        </p>

        {/* Resend button with cooldown */}
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || isResending}
          className={cn(
            "flex items-center justify-center gap-2",
            "py-2.5 px-6 rounded-[var(--radius-sm)]",
            "border border-border text-body font-bold text-text-dark",
            "transition-all duration-200",
            "hover:bg-gray-50 dark:hover:bg-surface-dark",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isResending && <Loader2 size={16} className="animate-spin" />}
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification email"}
        </button>
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
