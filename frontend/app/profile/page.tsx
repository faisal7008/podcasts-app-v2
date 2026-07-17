"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserCircle, Shield, Settings } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/lib/auth-client";
import { ProtectedRoute } from "@/components/protected-route";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Avatar } from "@/components/profile/avatar";
import { SettingsTab } from "@/components/profile/settings-tab";
import { ProfileTab } from "@/components/profile/profile-tab";
import { SecurityTab } from "@/components/profile/security-tab";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

type Tab = "profile" | "security" | "settings";

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "profile", label: "Profile", icon: UserCircle },
  { id: "security", label: "Security", icon: Shield },
  { id: "settings", label: "Settings", icon: Settings },
];

function ProfileContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const { data: profileData, mutate: mutateProfile } = useSWR("/api/profile", fetcher);

  const preferences = profileData?.preferences || {
    theme: "system",
    playbackSpeed: 1.0,
    notificationsEnabled: true,
  };

  const handleUpdatePreferences = useCallback(async (updates: Record<string, unknown>) => {
    // Optimistic UI update
    mutateProfile(
      { ...profileData, preferences: { ...preferences, ...updates } },
      false
    );

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: updates }),
    });
    if (!res.ok) {
      // Rollback
      mutateProfile(profileData, false);
      toast.error("Failed to update preferences");
      throw new Error("Failed to update");
    }
    mutateProfile(); // Revalidate
  }, [profileData, preferences, mutateProfile]);

  const handleDeleteAccount = useCallback(async (password: string) => {
    const res = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to delete account");
    }
    await signOut();
    router.push("/");
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="interior" backTitle="Profile" backHref="/" />

      <main className="flex-1">
        <div className="mx-auto max-w-[1440px] px-4 md:px-[180px] lg:px-[271px] py-8 md:py-12">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Sidebar */}
            <aside className="lg:w-[260px] flex-shrink-0">
              <div className="flex flex-col items-center lg:items-start gap-4">
                <Avatar
                  src={user?.image}
                  name={user?.name}
                  size={100}
                />
                <div className="text-center lg:text-left">
                  <h2 className="text-heading text-text-dark">
                    {user?.name || "User"}
                  </h2>
                  <p className="text-body text-text-muted mt-1">
                    {user?.email}
                  </p>
                </div>

                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2",
                    "rounded-[var(--radius-sm)] border border-border",
                    "text-body font-bold text-text-muted",
                    "transition-all duration-200",
                    "hover:text-text-dark hover:bg-gray-50 dark:hover:bg-surface-dark"
                  )}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </aside>

            {/* Tabs */}
            <div className="flex-1 min-w-0">
              {/* Tab Navigation */}
              <div className="flex gap-1 border-b border-divider mb-6 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-body font-bold whitespace-nowrap",
                      "border-b-2 transition-all duration-200",
                      activeTab === tab.id
                        ? "border-surface-dark text-text-dark dark:border-white"
                        : "border-transparent text-text-muted hover:text-text-dark"
                    )}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="animate-fade-in">
                {activeTab === "profile" && <ProfileTab />}
                {activeTab === "security" && <SecurityTab />}
                {activeTab === "settings" && (
                  <SettingsTab
                    preferences={preferences}
                    onUpdate={handleUpdatePreferences}
                    onDeleteAccount={handleDeleteAccount}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
