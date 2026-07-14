"use client";

import { ReactNode } from "react";
import { PlayerProvider } from "@/components/player/player-provider";
import { BottomPlayer } from "@/components/player/bottom-player";
import { Queue } from "@/components/queue";
import { usePathname } from "next/navigation";

export function GlobalPlayerWrapper({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      {/* 
        We render children inside the provider so any child can call usePlayer().
        The player components are appended globally so they persist across routes.
      */}
      <div className="pb-24 lg:pb-28">
        {children}
      </div>
      
      {/* Global player UI */}
      <BottomPlayer />
      <Queue />
    </PlayerProvider>
  );
}
