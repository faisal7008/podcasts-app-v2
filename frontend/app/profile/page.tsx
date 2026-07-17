"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Edit3, Music, Heart, Users, Settings } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/lib/auth-client";
import { ProtectedRoute } from "@/components/protected-route";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Avatar } from "@/components/profile/avatar";
import { SettingsTab } from "@/components/profile/settings-tab";

type Tab = "history" | "liked" | "following" | "settings";

const tabs: { id: Tab; label: string; icon: typeof Music }[] = [
  { id: "history", label: "Listening History", icon: Music },
  { id: "liked", label: "Liked Episodes", icon: Heart },
  { id: "following", label: "Following", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

function ProfileContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("history");
  const [preferences, setPreferences] = useState({
    theme: "system",
    playbackSpeed: 1.0,
    notificationsEnabled: true,
  });

  // Fetch user preferences
  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.preferences) {
          setPreferences({
            theme: data.preferences.theme,
            playbackSpeed: data.preferences.playbackSpeed,
            notificationsEnabled: data.preferences.notificationsEnabled,
          });
        }
      })
      .catch(() => {
        // Preferences not yet created; use defaults
      });
  }, []);

  const handleUpdatePreferences = useCallback(async (updates: Record<string, unknown>) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: updates }),
    });
    if (!res.ok) throw new Error("Failed to update");
    const data = await res.json();
    if (data.preferences) {
      setPreferences((prev) => ({ ...prev, ...data.preferences }));
    }
  }, []);

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
                {activeTab === "history" && (
                  <EmptyState
                    icon={Music}
                    title="No listening history"
                    description="Start listening to episodes to see your history here."
                  />
                )}
                {activeTab === "liked" && (
                  <EmptyState
                    icon={Heart}
                    title="No liked episodes"
                    description="Like episodes to save them to your collection."
                  />
                )}
                {activeTab === "following" && (
                  <EmptyState
                    icon={Users}
                    title="Not following any podcasts"
                    description="Follow podcasts to keep up with new episodes."
                  />
                )}
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

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Music;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-full bg-divider/50 flex items-center justify-center mb-4">
        <Icon size={24} className="text-text-muted" />
      </div>
      <h3 className="text-subtitle-bold text-text-dark mb-2">{title}</h3>
      <p className="text-body text-text-muted max-w-sm">{description}</p>
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
