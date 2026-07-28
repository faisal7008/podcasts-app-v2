"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export function ProfileTab() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await authClient.updateUser({
        name,
      });

      if (error) {
        throw new Error(error.message);
      }
      
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div>
        <h3 className="text-subtitle-bold text-text-dark mb-2">User Details</h3>
        <p className="text-body text-text-muted mb-4">
          Update your profile information and how others see you on the platform.
        </p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-body font-bold text-text-dark">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            disabled
            value={user?.email || ""}
            className={cn(
              "w-full px-4 py-2.5 rounded-[var(--radius-sm)] border border-border bg-gray-50 dark:bg-surface-dark text-text-muted",
              "focus:outline-none",
              "transition-all duration-200"
            )}
          />
          <p className="text-sm text-text-muted">
            Email address cannot be changed currently.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="name" className="text-body font-bold text-text-dark">
            Display Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your display name"
            className={cn(
              "w-full px-4 py-2.5 rounded-[var(--radius-sm)] border border-border bg-transparent text-text-dark",
              "focus:outline-none focus:ring-2 focus:ring-surface-dark/20 focus:border-surface-dark dark:focus:ring-white/20 dark:focus:border-white",
              "transition-all duration-200"
            )}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || name === user?.name || !name.trim()}
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
          Save Changes
        </button>
      </form>
    </div>
  );
}
