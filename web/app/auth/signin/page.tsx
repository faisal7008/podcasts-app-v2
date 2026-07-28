"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { signInSchema, type SignInValues } from "@/lib/validations/auth";
import { signIn } from "@/lib/auth-client";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { SocialButtons } from "@/components/auth/social-buttons";
import { AuthDivider } from "@/components/auth/auth-divider";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (values: SignInValues) => {
    setIsLoading(true);
    try {
      const { error } = await signIn.email({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast.error(error.message || "Invalid email or password");
        return;
      }

      toast.success("Signed in successfully");
      router.push(callbackUrl);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await signIn.social({ provider: "google", callbackURL: callbackUrl });
  };

  const handleGithubSignIn = async () => {
    await signIn.social({ provider: "github", callbackURL: callbackUrl });
  };

  return (
    <AuthCard
      title="Sign in to your account"
      subtitle="Welcome back! Enter your credentials to continue."
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

        {/* Password */}
        <PasswordInput
          label="Password"
          placeholder="Enter your password"
          autoComplete="current-password"
          error={errors.password?.message}
          registration={register("password")}
        />

        {/* Forgot password link */}
        <div className="flex justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-[13px] text-text-muted hover:text-text-dark transition-colors"
          >
            Forgot password?
          </Link>
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
          Sign In
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

      {/* Sign up link */}
      <p className="text-center text-body text-text-muted mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="font-bold text-text-dark hover:underline transition-colors"
        >
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-surface-dark" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
