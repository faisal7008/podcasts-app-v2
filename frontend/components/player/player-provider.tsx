"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { Episode, PlayerState, QueueItem } from "@/types/podcast";

interface PlayerContextValue extends PlayerState {
  play: (episode: Episode) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  addToQueue: (episode: Episode) => void;
  removeFromQueue: (episodeId: string) => void;
  clearQueue: () => void;
  reorderQueue: (newQueue: QueueItem[]) => void;
  playNext: () => void;
  openPlayer: () => void;
  closePlayer: () => void;
  toggleQueue: () => void;
  toggleMiniPlayer: () => void;
  showToast: (msg: string) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

/**
 * Hook to access the player context.
 * Must be used within a PlayerProvider.
 */
export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}

interface PlayerProviderProps {
  children: ReactNode;
}

/**
 * Global player state provider.
 * Manages audio playback, queue, and player UI state.
 * Uses HTML5 Audio API for actual audio playback.
 */
export function PlayerProvider({ children }: PlayerProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [state, setState] = useState<PlayerState>({
    currentEpisode: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    queue: [],
    isPlayerOpen: false,
    isQueueOpen: false,
    isMiniPlayerVisible: false,
    toastMessage: null,
  });

  const playNextInternal = useCallback(() => {
    setState((prev) => {
      if (prev.queue.length > 0) {
        const [next, ...rest] = prev.queue;
        const audio = audioRef.current;
        if (audio && next.episode.audioSrc) {
          audio.src = next.episode.audioSrc;
          audio.play().catch(() => {});
        }
        return {
          ...prev,
          currentEpisode: next.episode,
          queue: rest,
          isPlaying: true,
          currentTime: 0,
          isMiniPlayerVisible: true,
        };
      }
      return prev;
    });
  }, []);

  // Initialize audio element on mount
  useEffect(() => {
    const audio = new Audio();
    audio.volume = state.volume;
    audio.preload = "none";
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setState((prev) => ({ ...prev, currentTime: audio.currentTime }));
    };

    const onDurationChange = () => {
      setState((prev) => ({ ...prev, duration: audio.duration || 0 }));
    };

    const onEnded = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
      // Auto-play next in queue
      playNextInternal();
    };

    const onPlay = () => {
      setState((prev) => ({ ...prev, isPlaying: true }));
    };

    const onPause = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playNextInternal]);

  const play = useCallback((episode: Episode) => {
    const audio = audioRef.current;
    if (audio) {
      if (episode.audioSrc) {
        audio.src = episode.audioSrc;
        audio.play().catch(() => {});
      }
    }
    setState((prev) => ({
      ...prev,
      currentEpisode: episode,
      isPlaying: true,
      currentTime: 0,
      duration: episode.duration,
      isMiniPlayerVisible: true,
    }));
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {});
    setState((prev) => ({ ...prev, isPlaying: true }));
  }, []);

  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [state.isPlaying, pause, resume]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
    }
    setState((prev) => ({ ...prev, currentTime: time }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
    setState((prev) => ({ ...prev, volume }));
  }, []);

  const skipForward = useCallback((seconds: number = 30) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.min(
        audio.currentTime + seconds,
        audio.duration || Infinity
      );
    }
  }, []);

  const skipBackward = useCallback((seconds: number = 15) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.max(audio.currentTime - seconds, 0);
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setState((prev) => ({ ...prev, toastMessage: msg }));
    setTimeout(() => {
      setState((prev) => (prev.toastMessage === msg ? { ...prev, toastMessage: null } : prev));
    }, 3000);
  }, []);

  const addToQueue = useCallback((episode: Episode) => {
    const item: QueueItem = { episode, addedAt: new Date().toISOString() };
    setState((prev) => ({
      ...prev,
      queue: [...prev.queue, item],
    }));
    showToast("Added to queue");
  }, [showToast]);

  const removeFromQueue = useCallback((episodeId: string) => {
    setState((prev) => ({
      ...prev,
      queue: prev.queue.filter((item) => item.episode.id !== episodeId),
    }));
  }, []);

  const clearQueue = useCallback(() => {
    setState((prev) => ({ ...prev, queue: [] }));
  }, []);

  const reorderQueue = useCallback((newQueue: QueueItem[]) => {
    setState((prev) => ({ ...prev, queue: newQueue }));
  }, []);

  const playNext = useCallback(() => {
    playNextInternal();
  }, [playNextInternal]);

  const openPlayer = useCallback(() => {
    setState((prev) => ({ ...prev, isPlayerOpen: true, isQueueOpen: false }));
  }, []);

  const closePlayer = useCallback(() => {
    setState((prev) => ({ ...prev, isPlayerOpen: false }));
  }, []);

  const toggleQueue = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isQueueOpen: !prev.isQueueOpen,
    }));
  }, []);

  const toggleMiniPlayer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isMiniPlayerVisible: !prev.isMiniPlayerVisible,
    }));
  }, []);

  const value: PlayerContextValue = {
    ...state,
    play,
    pause,
    resume,
    togglePlay,
    seek,
    setVolume,
    skipForward,
    skipBackward,
    addToQueue,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    playNext,
    openPlayer,
    closePlayer,
    toggleQueue,
    toggleMiniPlayer,
    showToast,
  };

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}
