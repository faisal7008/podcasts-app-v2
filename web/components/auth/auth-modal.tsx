"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { signInSchema, type SignInValues } from "@/lib/validations/auth";
import { signIn } from "@/lib/auth-client";
import { PasswordInput } from "@/components/auth/password-input";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after successful auth */
  onSuccess?: () => void;
  /** Message to show explaining why auth is needed */
  message?: string;
}

/**
 * Compact auth modal for inline authentication prompts.
 * Used when unauthenticated users try actions like Follow or Like.
 * Closes on outside click or successful auth.
 */
export function AuthModal({ isOpen, onClose, onSuccess, message }: AuthModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
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
      reset();
      router.refresh();
      onSuccess?.();
      onClose();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm mx-4 bg-bg rounded-[var(--radius-lg)] border border-divider shadow-[var(--shadow-player)] animate-fade-in p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-dark transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <h2 className="text-subtitle-bold text-text-dark">Sign in to continue</h2>
          {message && (
            <p className="text-body text-text-muted mt-1">{message}</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <input
              type="email"
              autoComplete="email"
              placeholder="Email"
              className={cn(
                "w-full rounded-[var(--radius-sm)] border bg-bg px-4 py-2.5 text-body text-text-primary",
                "placeholder:text-text-muted",
                "transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-surface-dark/30 focus:border-surface-dark",
                "dark:focus:ring-white/20 dark:focus:border-white/50",
                errors.email ? "border-red-500" : "border-border"
              )}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-[12px] text-red-500 mt-0.5">{errors.email.message}</p>
            )}
          </div>

          <PasswordInput
            label=""
            placeholder="Password"
            autoComplete="current-password"
            error={errors.password?.message}
            registration={register("password")}
          />

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full flex items-center justify-center gap-2",
              "py-2.5 px-4 rounded-[var(--radius-sm)]",
              "bg-surface-dark text-white font-bold text-body",
              "transition-all duration-200",
              "hover:opacity-90 active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            Sign In
          </button>
        </form>

        {/* Links */}
        <div className="flex justify-between mt-4 text-[13px] text-text-muted">
          <a href="/auth/signup" className="hover:text-text-dark transition-colors">
            Create account
          </a>
          <a href="/auth/forgot-password" className="hover:text-text-dark transition-colors">
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
}
