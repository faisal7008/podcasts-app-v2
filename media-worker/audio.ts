import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import * as path from "path";

export async function processAudio(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      // Normalize audio loudnorm filter (EBU R128)
      .audioFilter("loudnorm=I=-16:LRA=11:TP=-1.5")
      // Convert to M4A (AAC)
      .audioCodec("aac")
      .audioBitrate("128k")
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        reject(err);
      })
      .run();
  });
}

/**
 * Very basic waveform generation stub.
 * In a real-world scenario, you might use 'audiowaveform' from BBC.
 */
export async function generateWaveform(inputPath: string): Promise<number[]> {
  // Returns dummy waveform data (e.g. an array of amplitudes 0-100)
  // To keep dependencies light, we stub this out for now.
  const waveform = Array.from({ length: 100 }, () => Math.floor(Math.random() * 100));
  return waveform;
}
