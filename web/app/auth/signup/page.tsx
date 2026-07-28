"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { signUpSchema, type SignUpValues } from "@/lib/validations/auth";
import { signUp } from "@/lib/auth-client";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrengthIndicator } from "@/components/auth/password-strength";
import { SocialButtons } from "@/components/auth/social-buttons";
import { AuthDivider } from "@/components/auth/auth-divider";
import { signIn } from "@/lib/auth-client";

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
  });

  const watchPassword = watch("password", "");

  const onSubmit = async (values: SignUpValues) => {
    setIsLoading(true);
    try {
      const { error } = await signUp.email({
        email: values.email,
        password: values.password,
        name: values.displayName || values.email.split("@")[0],
      });

      if (error) {
        toast.error(error.message || "Failed to create account");
        return;
      }

      toast.success("Account created! Please check your email.");
      setEmailSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await signIn.social({ provider: "google", callbackURL: "/" });
  };

  const handleGithubSignIn = async () => {
    await signIn.social({ provider: "github", callbackURL: "/" });
  };

  // Success state — show "check your email" message
  if (emailSent) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="We've sent a verification link to your email address."
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Mail size={28} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-body text-text-muted text-center">
            Click the link in the email to verify your account and start
            listening to your favorite podcasts.
          </p>
        </div>

        <p className="text-center text-body text-text-muted mt-4">
          Already verified?{" "}
          <Link
            href="/auth/signin"
            className="font-bold text-text-dark hover:underline transition-colors"
          >
            Sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join Podcasts and discover your next favorite show."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Display Name (optional) */}
        <div>
          <label
            htmlFor="displayName"
            className="block text-body font-bold text-text-dark mb-1.5"
          >
            Display Name{" "}
            <span className="font-normal text-text-muted">(optional)</span>
          </label>
          <input
            id="displayName"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            className={cn(
              "w-full rounded-[var(--radius-sm)] border border-border bg-bg px-4 py-3 text-body text-text-primary",
              "placeholder:text-text-muted",
              "transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-surface-dark/30 focus:border-surface-dark",
              "dark:focus:ring-white/20 dark:focus:border-white/50"
            )}
            {...register("displayName")}
          />
        </div>

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

        {/* Password */}
        <div>
          <PasswordInput
            label="Password"
            placeholder="Create a strong password"
            autoComplete="new-password"
            error={errors.password?.message}
            registration={register("password")}
          />
          <PasswordStrengthIndicator password={watchPassword} />
        </div>

        {/* Confirm Password */}
        <PasswordInput
          label="Confirm Password"
          placeholder="Re-enter your password"
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
          Create Account
        </button>
      </form>

      {/* Divider */}
      <AuthDivider />

      {/* Social buttons */}
      <SocialButtons
        onGoogleClick={handleGoogleSignIn}
        onGithubClick={handleGithubSignIn}
        disabled={isLoading}
      />

      {/* Sign in link */}
      <p className="text-center text-body text-text-muted mt-6">
        Already have an account?{" "}
        <Link
          href="/auth/signin"
          className="font-bold text-text-dark hover:underline transition-colors"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
