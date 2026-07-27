import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import * as path from "path";

export async function processAudio(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      // Normalize audio loudnorm filter (EBU R128)
      .audioFilter("loudnorm=I=-16:LRA=11:TP=-1.5")
      // Convert to WAV for transcription
      .toFormat("wav")
      .audioCodec("pcm_s16le")
      .audioFrequency(16000)
      .audioChannels(1)
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        reject(err);
      })
      .run();
  });
}

