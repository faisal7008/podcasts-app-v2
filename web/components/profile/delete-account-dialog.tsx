"use client";

import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { deleteAccountSchema, type DeleteAccountValues } from "@/lib/validations/auth";

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}

/**
 * Destructive confirmation dialog for account deletion.
 * Requires password confirmation before proceeding.
 */
export function DeleteAccountDialog({ isOpen, onClose, onConfirm }: DeleteAccountDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeleteAccountValues>({
    resolver: zodResolver(deleteAccountSchema),
  });

  const onSubmit = async (values: DeleteAccountValues) => {
    setIsDeleting(true);
    try {
      await onConfirm(values.password);
      toast.success("Account deleted successfully.");
      reset();
    } catch {
      toast.error("Failed to delete account. Check your password.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      reset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Delete account confirmation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md mx-4 bg-bg rounded-[var(--radius-lg)] border border-divider shadow-[var(--shadow-player)] animate-fade-in p-6">
        {/* Warning icon */}
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Title & description */}
        <h2 className="text-heading text-text-dark text-center mb-2">
          Delete your account?
        </h2>
        <p className="text-body text-text-muted text-center mb-6">
          This action is permanent and cannot be undone. All your data —
          including your library, listening history, and preferences — will be
          permanently deleted.
        </p>

        {/* Password confirmation form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="delete-password"
              className="block text-body font-bold text-text-dark mb-1.5"
            >
              Confirm your password
            </label>
            <input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              className={cn(
                "w-full rounded-[var(--radius-sm)] border bg-bg px-4 py-3 text-body text-text-primary",
                "placeholder:text-text-muted",
                "transition-colors duration-200",
                "focus:outline-none focus:ring-2",
                errors.password
                  ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
                  : "border-border focus:ring-surface-dark/30 focus:border-surface-dark dark:focus:ring-white/20 dark:focus:border-white/50"
              )}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-[13px] text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isDeleting}
              className={cn(
                "flex-1 py-3 px-4 rounded-[var(--radius-sm)]",
                "border border-border text-body font-bold text-text-dark",
                "transition-all duration-200",
                "hover:bg-gray-50 dark:hover:bg-surface-dark",
                "disabled:opacity-50"
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDeleting}
              className={cn(
                "flex-1 flex items-center justify-center gap-2",
                "py-3 px-4 rounded-[var(--radius-sm)]",
                "bg-red-600 text-white font-bold text-body",
                "transition-all duration-200",
                "hover:bg-red-700 active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isDeleting && <Loader2 size={16} className="animate-spin" />}
              Delete My Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
