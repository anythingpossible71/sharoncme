import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { logger } from "@/lib/logger";

// Singleton FFmpeg instance to avoid reloading WASM on every request
let ffmpegInstance: FFmpeg | null = null;
let isInitializing = false;
let initPromise: Promise<FFmpeg> | null = null;

/**
 * Get or initialize FFmpeg instance
 * Uses singleton pattern to avoid reloading WASM files on every request
 *
 * Note: In serverless environments (Vercel/Netlify), each cold start will
 * reload WASM files (~30MB), which adds ~1-2s to the first request.
 * Subsequent requests in the same instance will reuse the loaded instance.
 */
async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      const ffmpeg = new FFmpeg();

      // Load FFmpeg WASM files
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      ffmpegInstance = ffmpeg;
      isInitializing = false;
      logger.info("[FFmpeg] FFmpeg initialized successfully");
      return ffmpeg;
    } catch (error) {
      isInitializing = false;
      initPromise = null;
      logger.error(
        "[FFmpeg] Failed to initialize FFmpeg",
        {},
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Resize an image using FFmpeg
 * @param inputBuffer - Input image buffer
 * @param width - Target width
 * @param height - Target height
 * @param outputFormat - Output format (png, jpg, webp, etc.)
 * @returns Resized image buffer
 */
export async function resizeImageWithFFmpeg(
  inputBuffer: Buffer,
  width: number,
  height: number,
  outputFormat: string = "png"
): Promise<Buffer> {
  try {
    const ffmpeg = await getFFmpeg();

    // Generate unique filenames for this operation
    const inputFileName = `input_${Date.now()}.${outputFormat}`;
    const outputFileName = `output_${Date.now()}.${outputFormat}`;

    // Write input file to FFmpeg's virtual filesystem
    await ffmpeg.writeFile(inputFileName, new Uint8Array(inputBuffer));

    // Execute FFmpeg command to resize image
    // -vf scale=WIDTH:HEIGHT:force_original_aspect_ratio=decrease - maintains aspect ratio
    // -vf scale=WIDTH:HEIGHT:force_original_aspect_ratio=increase,pad=WIDTH:HEIGHT - fills dimensions
    await ffmpeg.exec([
      "-i",
      inputFileName,
      "-vf",
      `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=transparent`,
      "-y", // Overwrite output file
      outputFileName,
    ]);

    // Read output file from FFmpeg's virtual filesystem
    const outputData = await ffmpeg.readFile(outputFileName);

    // Clean up temporary files
    try {
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
    } catch (cleanupError) {
      logger.warn("[FFmpeg] Failed to cleanup temporary files", {
        error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
      });
    }

    // Convert Uint8Array to Buffer
    const buffer = Buffer.from(outputData as Uint8Array);

    logger.info(`[FFmpeg] Resized image to ${width}x${height}`, {
      originalSize: inputBuffer.length,
      processedSize: buffer.length,
    });

    return buffer;
  } catch (error) {
    logger.error("[FFmpeg] Failed to resize image", {}, error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Check if FFmpeg is available
 * Useful for fallback logic
 */
export async function isFFmpegAvailable(): Promise<boolean> {
  try {
    await getFFmpeg();
    return true;
  } catch {
    return false;
  }
}
