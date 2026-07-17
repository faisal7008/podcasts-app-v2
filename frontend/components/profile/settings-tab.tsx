"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Monitor, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { DeleteAccountDialog } from "@/components/profile/delete-account-dialog";

interface SettingsTabProps {
  preferences: {
    theme: string;
    playbackSpeed: number;
    notificationsEnabled: boolean;
  };
  onUpdate: (updates: Record<string, unknown>) => Promise<void>;
  onDeleteAccount: (password: string) => Promise<void>;
}

const playbackSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

/**
 * Settings tab for the profile page.
 * Includes theme toggle, playback speed, notifications, and delete account.
 */
export function SettingsTab({ preferences, onUpdate, onDeleteAccount }: SettingsTabProps) {
  const { theme, toggleTheme } = useTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [speed, setSpeed] = useState(preferences.playbackSpeed);
  const [notifications, setNotifications] = useState(preferences.notificationsEnabled);

  useEffect(() => {
    setSpeed(preferences.playbackSpeed);
    setNotifications(preferences.notificationsEnabled);
  }, [preferences]);

  const handleSpeedChange = async (newSpeed: number) => {
    setSpeed(newSpeed);
    try {
      await onUpdate({ playbackSpeed: newSpeed });
      toast.success(`Playback speed set to ${newSpeed}x`);
    } catch {
      toast.error("Failed to update playback speed");
      setSpeed(preferences.playbackSpeed);
    }
  };

  const handleNotificationsToggle = async () => {
    const newValue = !notifications;
    setNotifications(newValue);
    try {
      await onUpdate({ notificationsEnabled: newValue });
      toast.success(newValue ? "Notifications enabled" : "Notifications disabled");
    } catch {
      toast.error("Failed to update notification preference");
      setNotifications(!newValue);
    }
  };

  return (
    <div className="space-y-8">
      {/* Theme */}
      <section>
        <h3 className="text-subtitle-bold text-text-dark mb-4">Appearance</h3>
        <div className="flex gap-3">
          {[
            { value: "light", icon: Sun, label: "Light" },
            { value: "dark", icon: Moon, label: "Dark" },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => {
                if (theme !== value) toggleTheme();
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-sm)] border text-body font-bold",
                "transition-all duration-200",
                theme === value
                  ? "border-surface-dark bg-surface-dark text-white dark:border-white dark:bg-white dark:text-surface-dark"
                  : "border-border text-text-dark hover:bg-gray-50 dark:hover:bg-surface-dark"
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Playback Speed */}
      <section>
        <h3 className="text-subtitle-bold text-text-dark mb-4">Default Playback Speed</h3>
        <div className="flex flex-wrap gap-2">
          {playbackSpeeds.map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              className={cn(
                "px-4 py-2 rounded-[var(--radius-sm)] border text-body font-bold",
                "transition-all duration-200",
                speed === s
                  ? "border-surface-dark bg-surface-dark text-white dark:border-white dark:bg-white dark:text-surface-dark"
                  : "border-border text-text-dark hover:bg-gray-50 dark:hover:bg-surface-dark"
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section>
        <h3 className="text-subtitle-bold text-text-dark mb-4">Notifications</h3>
        <button
          onClick={handleNotificationsToggle}
          className="flex items-center gap-3"
        >
          <div
            className={cn(
              "w-11 h-6 rounded-full relative transition-colors duration-200",
              notifications ? "bg-emerald-500" : "bg-divider"
            )}
          >
            <div
              className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                notifications ? "translate-x-[22px]" : "translate-x-0.5"
              )}
            />
          </div>
          <span className="text-body text-text-dark">
            {notifications ? "Notifications enabled" : "Notifications disabled"}
          </span>
        </button>
      </section>

      {/* Danger Zone */}
      <section className="pt-6 border-t border-divider">
        <h3 className="text-subtitle-bold text-red-600 dark:text-red-400 mb-2">
          Danger Zone
        </h3>
        <p className="text-body text-text-muted mb-4">
          Once you delete your account, there is no going back. This action is
          permanent.
        </p>
        <button
          onClick={() => setShowDeleteDialog(true)}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5",
            "rounded-[var(--radius-sm)] border border-red-300 dark:border-red-800",
            "text-body font-bold text-red-600 dark:text-red-400",
            "transition-all duration-200",
            "hover:bg-red-50 dark:hover:bg-red-900/20"
          )}
        >
          <Trash2 size={16} />
          Delete Account
        </button>
      </section>

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={onDeleteAccount}
      />
    </div>
  );
}
