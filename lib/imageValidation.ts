const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 48_000_000;
const MAX_OPTIMIZED_DIMENSION = 1600;
const TARGET_OPTIMIZED_BYTES = 700 * 1024;
const OPTIMIZATION_QUALITIES = [0.78, 0.74, 0.7] as const;
const OPTIMIZATION_DIMENSIONS = [1600, 1440, 1280] as const;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type OptimizedImage = {
  file: File;
  width: number;
  height: number;
  originalBytes: number;
};

export function validateImageFile(file: File) {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return "Please select a JPEG, PNG, or WebP image.";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return "Each original image must be 15 MB or smaller.";
  }

  return null;
}

export function safeStorageFileName(file: File) {
  return file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function optimizedFileName(file: File, type: string) {
  const baseName = safeStorageFileName(file).replace(/\.[^.]+$/, "") || "inspection-photo";
  return `${baseName}.${type === "image/webp" ? "webp" : "jpg"}`;
}

function canvasBlob(
  canvas: HTMLCanvasElement,
  type: "image/webp" | "image/jpeg",
  quality: number,
) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

export async function optimizeImageForUpload(
  file: File,
): Promise<OptimizedImage> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This image could not be decoded. Please choose another file.");
  }

  try {
    if (bitmap.width * bitmap.height > MAX_IMAGE_PIXELS) {
      throw new Error(
        "This image has unreasonable dimensions. Please use an image smaller than 48 megapixels.",
      );
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Image optimization is not available in this browser.");

    let bestBlob: Blob | null = null;
    let bestWidth = 0;
    let bestHeight = 0;

    for (const dimension of OPTIMIZATION_DIMENSIONS) {
      const maximumDimension = Math.min(dimension, MAX_OPTIMIZED_DIMENSION);
      const scale = Math.min(1, maximumDimension / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      canvas.width = width;
      canvas.height = height;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);

      for (const quality of OPTIMIZATION_QUALITIES) {
        let blob = await canvasBlob(canvas, "image/webp", quality);
        if (!blob || blob.type !== "image/webp") {
          blob = await canvasBlob(canvas, "image/jpeg", quality);
        }
        if (!blob) continue;

        if (!bestBlob || blob.size < bestBlob.size) {
          bestBlob = blob;
          bestWidth = width;
          bestHeight = height;
        }
        if (blob.size <= TARGET_OPTIMIZED_BYTES) {
          return {
            file: new File([blob], optimizedFileName(file, blob.type), {
              type: blob.type,
              lastModified: Date.now(),
            }),
            width,
            height,
            originalBytes: file.size,
          };
        }
      }
    }

    if (!bestBlob) throw new Error("This image could not be optimized for upload.");

    return {
      file: new File([bestBlob], optimizedFileName(file, bestBlob.type), {
        type: bestBlob.type,
        lastModified: Date.now(),
      }),
      width: bestWidth,
      height: bestHeight,
      originalBytes: file.size,
    };
  } finally {
    bitmap.close();
  }
}
