"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await authClient.changePassword({
        newPassword,
        currentPassword,
        revokeOtherSessions: true
      });

      if (error) {
        throw new Error(error.message);
      }
      
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div>
        <h3 className="text-subtitle-bold text-text-dark mb-2">Change Password</h3>
        <p className="text-body text-text-muted mb-4">
          Update your password to keep your account secure.
        </p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="current-password" className="text-body font-bold text-text-dark">
            Current Password
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={cn(
              "w-full px-4 py-2.5 rounded-[var(--radius-sm)] border border-border bg-transparent text-text-dark",
              "focus:outline-none focus:ring-2 focus:ring-surface-dark/20 focus:border-surface-dark dark:focus:ring-white/20 dark:focus:border-white",
              "transition-all duration-200"
            )}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="new-password" className="text-body font-bold text-text-dark">
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={cn(
              "w-full px-4 py-2.5 rounded-[var(--radius-sm)] border border-border bg-transparent text-text-dark",
              "focus:outline-none focus:ring-2 focus:ring-surface-dark/20 focus:border-surface-dark dark:focus:ring-white/20 dark:focus:border-white",
              "transition-all duration-200"
            )}
            required
            minLength={8}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm-password" className="text-body font-bold text-text-dark">
            Confirm New Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={cn(
              "w-full px-4 py-2.5 rounded-[var(--radius-sm)] border border-border bg-transparent text-text-dark",
              "focus:outline-none focus:ring-2 focus:ring-surface-dark/20 focus:border-surface-dark dark:focus:ring-white/20 dark:focus:border-white",
              "transition-all duration-200"
            )}
            required
            minLength={8}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-2.5",
            "rounded-[var(--radius-sm)] border border-border",
            "text-body font-bold text-text-muted",
            "transition-all duration-200",
            "hover:text-text-dark hover:bg-gray-50 dark:hover:bg-surface-dark",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isLoading && <Loader2 size={16} className="animate-spin" />}
          Update Password
        </button>
      </form>
    </div>
  );
}
