"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface AudioRecorderState {
  /** Whether the recorder is actively capturing audio */
  isRecording: boolean;
  /** Whether the recorder is paused */
  isPaused: boolean;
  /** Recording duration in seconds */
  duration: number;
  /** The recorded audio blob (available after stopping) */
  audioBlob: Blob | null;
  /** Object URL for playback preview (available after stopping) */
  audioUrl: string | null;
  /** AnalyserNode for live waveform visualization */
  analyserNode: AnalyserNode | null;
  /** Error message if something went wrong */
  error: string | null;
}

export interface AudioRecorderActions {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
}

export type UseAudioRecorderReturn = AudioRecorderState & AudioRecorderActions;

/**
 * React hook that encapsulates the MediaRecorder API for in-browser audio recording.
 *
 * - Records audio as WebM/Opus (best browser compatibility)
 * - Provides a live AnalyserNode for waveform visualization
 * - Handles browser compatibility and permission errors
 * - Tracks duration with a timer
 */
export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedBeforePauseRef = useRef<number>(0);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      stopTimer();
      cleanupStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = elapsedBeforePauseRef.current + (Date.now() - startTimeRef.current) / 1000;
      setDuration(Math.floor(elapsed));
    }, 100);
  }, []);

  const cleanupStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(null);
      setDuration(0);
      elapsedBeforePauseRef.current = 0;
      chunksRef.current = [];

      // Check browser support
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Your browser doesn't support audio recording. Please use a modern browser.");
        return;
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });

      mediaStreamRef.current = stream;

      // Set up Web Audio API for waveform visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      setAnalyserNode(analyser);

      // Determine best available MIME type
      const mimeType = getMimeType();

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setIsRecording(false);
        setIsPaused(false);
        stopTimer();
        cleanupStream();
        setAnalyserNode(null);
      };

      mediaRecorder.onerror = () => {
        setError("Recording error occurred. Please try again.");
        setIsRecording(false);
        setIsPaused(false);
        stopTimer();
        cleanupStream();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);
      startTimer();
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setError("Microphone access denied. Please allow microphone access in your browser settings.");
        } else if (err.name === "NotFoundError") {
          setError("No microphone found. Please connect a microphone and try again.");
        } else {
          setError(`Recording error: ${err.message}`);
        }
      } else {
        setError("Failed to start recording. Please try again.");
      }
      cleanupStream();
    }
  }, [audioUrl, cleanupStream, startTimer, stopTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
      elapsedBeforePauseRef.current += (Date.now() - startTimeRef.current) / 1000;
    }
  }, [stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
    }
  }, [startTimer]);

  const resetRecording = useCallback(() => {
    stopRecording();
    stopTimer();
    cleanupStream();
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAnalyserNode(null);
    setError(null);
    chunksRef.current = [];
    elapsedBeforePauseRef.current = 0;
  }, [audioUrl, cleanupStream, stopRecording, stopTimer]);

  return {
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
  };
}

/**
 * Get the best available audio MIME type for MediaRecorder.
 * Prefers WebM/Opus, falls back to MP4/AAC, then WAV.
 */
function getMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "audio/webm"; // Default fallback
}
