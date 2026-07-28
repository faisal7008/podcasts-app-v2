"use client";

import { useRef, useEffect, useCallback } from "react";
import { Mic, Square, Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { formatPlayerTime } from "@/lib/utils";

interface AudioRecorderProps {
  /** Called when recording is complete and audio is ready for upload */
  onRecordingComplete: (blob: Blob, duration: number) => void;
}

/**
 * In-browser audio recorder with live waveform visualization.
 * Uses MediaRecorder API via the useAudioRecorder hook.
 */
export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    analyserNode,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  } = useAudioRecorder();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Waveform visualization
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserNode;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      const { width, height } = canvas;
      ctx.fillStyle = "rgba(0, 0, 0, 0)";
      ctx.clearRect(0, 0, width, height);

      // Draw waveform bars
      const barCount = 64;
      const barWidth = width / barCount - 2;
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step];
        const amplitude = Math.abs(value - 128) / 128;
        const barHeight = Math.max(4, amplitude * height * 0.8);

        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;

        // Gradient from accent to muted
        const hue = 220 + (i / barCount) * 40;
        ctx.fillStyle = `hsla(${hue}, 60%, 50%, ${0.6 + amplitude * 0.4})`;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }
    };

    draw();
  }, [analyserNode]);

  useEffect(() => {
    if (analyserNode) {
      drawWaveform();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyserNode, drawWaveform]);

  // Handle "Use Recording" button
  const handleUseRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, duration);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Error message */}
      {error && (
        <div className="w-full rounded-[var(--radius-sm)] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-[13px] text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Waveform / Idle State */}
      <div className={cn(
        "w-full h-[140px] rounded-[var(--radius-lg)] border border-divider",
        "flex items-center justify-center overflow-hidden",
        "bg-gray-50 dark:bg-surface-dark transition-colors",
        isRecording && "border-blue-400 dark:border-blue-600"
      )}>
        {isRecording ? (
          <canvas
            ref={canvasRef}
            width={600}
            height={120}
            className="w-full h-full px-4"
          />
        ) : audioUrl ? (
          /* Playback preview */
          <div className="flex flex-col items-center gap-3 px-4 w-full">
            <audio
              src={audioUrl}
              controls
              className="w-full max-w-md h-10"
              style={{ filter: "invert(0)" }}
            />
            <p className="text-[12px] text-text-muted">
              Recording preview • {formatPlayerTime(duration)}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-text-muted">
            <Mic size={32} strokeWidth={1.5} />
            <p className="text-[13px]">Click record to start</p>
          </div>
        )}
      </div>

      {/* Timer */}
      {isRecording && (
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full",
            isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"
          )} />
          <span className="text-subtitle-bold font-mono tabular-nums">
            {formatPlayerTime(duration)}
          </span>
          <span className="text-[12px] text-text-muted">
            {isPaused ? "Paused" : "Recording"}
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        {!isRecording && !audioUrl && (
          /* Start recording */
          <button
            onClick={startRecording}
            className={cn(
              "flex items-center gap-2 px-6 py-3",
              "rounded-[var(--radius-full)] font-bold text-[14px]",
              "bg-surface-dark text-white dark:bg-white dark:text-surface-dark",
              "transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
            )}
          >
            <Mic size={18} />
            Start Recording
          </button>
        )}

        {isRecording && (
          <>
            {/* Pause / Resume */}
            <button
              onClick={isPaused ? resumeRecording : pauseRecording}
              className={cn(
                "flex items-center justify-center w-12 h-12",
                "rounded-full border border-divider",
                "transition-all duration-200 hover:bg-gray-100 dark:hover:bg-surface-dark"
              )}
              aria-label={isPaused ? "Resume recording" : "Pause recording"}
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </button>

            {/* Stop */}
            <button
              onClick={stopRecording}
              className={cn(
                "flex items-center gap-2 px-6 py-3",
                "rounded-[var(--radius-full)] font-bold text-[14px]",
                "bg-red-600 text-white",
                "transition-all duration-200 hover:bg-red-700 active:scale-[0.97]"
              )}
            >
              <Square size={16} fill="currentColor" />
              Stop
            </button>
          </>
        )}

        {audioUrl && !isRecording && (
          <>
            {/* Re-record */}
            <button
              onClick={resetRecording}
              className={cn(
                "flex items-center gap-2 px-5 py-3",
                "rounded-[var(--radius-full)] text-[14px]",
                "border border-divider text-text-dark",
                "transition-all duration-200 hover:bg-gray-100 dark:hover:bg-surface-dark"
              )}
            >
              <RotateCcw size={16} />
              Re-record
            </button>

            {/* Use Recording */}
            <button
              onClick={handleUseRecording}
              className={cn(
                "flex items-center gap-2 px-6 py-3",
                "rounded-[var(--radius-full)] font-bold text-[14px]",
                "bg-surface-dark text-white dark:bg-white dark:text-surface-dark",
                "transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
              )}
            >
              Use Recording
            </button>
          </>
        )}
      </div>
    </div>
  );
}
