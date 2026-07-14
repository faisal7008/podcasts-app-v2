"use client";

import { ReactNode } from "react";
import { PlayerProvider } from "@/components/player/player-provider";
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
      <div className="pb-24 lg:pb-28">
        {children}
      </div>
      
      {/* Global player UI */}
      <MiniPlayer />
      <FullPlayer />
      <Queue />
    </PlayerProvider>
  );
}
