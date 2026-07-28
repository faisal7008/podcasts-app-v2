"use client";

import { ReactNode } from "react";
import { PlayerProvider, usePlayer } from "@/components/player/player-provider";
import { BottomPlayer } from "@/components/player/bottom-player";


function ToastContainer() {
  const { toastMessage } = usePlayer();
  
  return toastMessage ? (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-primary text-white text-sm font-bold shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      {toastMessage}
    </div>
  ) : null;
}

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
      <ToastContainer />
    </PlayerProvider>
  );
}
