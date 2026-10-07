export type PreparedMediaFile = {
  file: File;
  originalName: string;
  originalSize: number;
  optimized: boolean;
};

const MAX_IMAGE_DIMENSION = 2400;
const TARGET_IMAGE_BYTES = 1_200_000;
const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;
const WEBP_QUALITIES = [0.88, 0.85, 0.82, 0.78, 0.74, 0.70];

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const ALLOWED_VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm"]);

export const MEDIA_INPUT_ACCEPT = "image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,.jpg,.jpeg,.png,.webp,.mp4,.mov,.webm";
export const IMAGE_INPUT_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() || "";
}

function assertAllowedImage(file: File) {
  const extension = extensionOf(file.name);
  if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase()) || !ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    throw new Error(`${file.name} is not an allowed image. Use JPG, JPEG, PNG or WEBP.`);
  }
}

function assertAllowedVideo(file: File) {
  const extension = extensionOf(file.name);
  if (!ALLOWED_VIDEO_TYPES.has(file.type.toLowerCase()) || !ALLOWED_VIDEO_EXTENSIONS.has(extension)) {
    throw new Error(`${file.name} is not an allowed video. Use MP4, MOV or WEBM.`);
  }
}

function outputName(name: string) {
  const base = name.replace(/\.[^.]+$/, "") || "nikky-luxe-image";
  return `${base}.webp`;
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Could not optimize this image.")),
      "image/webp",
      quality,
    );
  });
}

async function compressImage(file: File): Promise<PreparedMediaFile> {
  assertAllowedImage(file);

  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error(`${file.name} is larger than 20 MB. Please choose a smaller image.`);
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`${file.name} could not be decoded as a valid image.`);
  }

  try {
    const largestSide = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / largestSide);
    let width = Math.max(1, Math.round(bitmap.width * scale));
    let height = Math.max(1, Math.round(bitmap.height * scale));

    let bestBlob: Blob | null = null;

    // Images above the target must be reduced to <= 1.2 MB before upload.
    // Start gently, then progressively trade excess resolution/quality only as needed.
    // Images already <= 1.2 MB are not aggressively forced through this process.
    const MIN_LONG_SIDE = 800;
    const RESIZE_FACTOR = 0.85;
    const MAX_RESIZE_PASSES = 10;

    for (let resizePass = 0; resizePass < MAX_RESIZE_PASSES; resizePass++) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) throw new Error("Your browser could not prepare this image for upload.");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, width, height);

      for (const quality of WEBP_QUALITIES) {
        const blob = await canvasBlob(canvas, quality);
        if (!bestBlob || blob.size < bestBlob.size) bestBlob = blob;
        if (blob.size <= TARGET_IMAGE_BYTES) break;
      }

      if (bestBlob && bestBlob.size <= TARGET_IMAGE_BYTES) break;

      const currentLongSide = Math.max(width, height);
      if (currentLongSide <= MIN_LONG_SIDE) break;

      const nextLongSide = Math.max(MIN_LONG_SIDE, Math.round(currentLongSide * RESIZE_FACTOR));
      const resizeScale = nextLongSide / currentLongSide;
      width = Math.max(1, Math.round(width * resizeScale));
      height = Math.max(1, Math.round(height * resizeScale));
    }

    if (!bestBlob) throw new Error(`${file.name} could not be optimized.`);

    // Small originals do not need aggressive compression. Keep the original unless
    // WebP provides a meaningful saving, and never replace it with a larger file.
    if (file.size <= TARGET_IMAGE_BYTES) {
      if (bestBlob.size >= file.size * 0.95) {
        return { file, originalName: file.name, originalSize: file.size, optimized: false };
      }
    } else {
      // Hard upload ceiling for images that started above 1.2 MB. If the browser
      // cannot reach it safely, do not silently upload a multi-megabyte original.
      if (bestBlob.size > TARGET_IMAGE_BYTES) {
        throw new Error(`${file.name} could not be reduced below 1.2 MB. Please choose a smaller image.`);
      }
    }

    if (bestBlob.size >= file.size) {
      return { file, originalName: file.name, originalSize: file.size, optimized: false };
    }

    const optimizedFile = new File([bestBlob], outputName(file.name), {
      type: "image/webp",
      lastModified: Date.now(),
    });

    return {
      file: optimizedFile,
      originalName: file.name,
      originalSize: file.size,
      optimized: true,
    };
  } finally {
    bitmap.close();
  }
}

export async function prepareMediaFiles(files: File[]): Promise<PreparedMediaFile[]> {
  const prepared: PreparedMediaFile[] = [];
  for (const file of files) {
    if (ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
      prepared.push(await compressImage(file));
      continue;
    }
    if (ALLOWED_VIDEO_TYPES.has(file.type.toLowerCase())) {
      assertAllowedVideo(file);
      prepared.push({ file, originalName: file.name, originalSize: file.size, optimized: false });
      continue;
    }
    throw new Error(`${file.name} is not an allowed media file. Use JPG, JPEG, PNG, WEBP, MP4, MOV or WEBM.`);
  }
  return prepared;
}

export async function prepareImageFile(file: File): Promise<PreparedMediaFile> {
  assertAllowedImage(file);
  return compressImage(file);
}
