"use client";

import { ReactNode } from "react";
import { PlayerProvider } from "@/components/player/player-provider";
import { PlayerSidebar } from "@/components/player/player-sidebar";
import { MiniPlayer } from "@/components/player/mini-player";
import { FullPlayer } from "@/components/player/full-player";
import { Queue } from "@/components/queue";
import { usePathname } from "next/navigation";

export function GlobalPlayerWrapper({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      {/* 
        We render children inside the provider so any child can call usePlayer().
        The player components are appended globally so they persist across routes.
      */}
      {children}
      
      {/* Global player UI */}
      <PlayerSidebar />
      <MiniPlayer />
      <FullPlayer />
      <Queue />
    </PlayerProvider>
  );
}
