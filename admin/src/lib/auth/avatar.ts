export const AVATAR_SIZE = 72;
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const MAX_AVATAR_BYTES = 24 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This image could not be opened."));
    };
    image.src = url;
  });
}

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("This browser could not prepare the image.")),
      "image/webp",
      0.82,
    );
  });
}

function dataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new Error("The prepared image could not be read."));
    reader.readAsDataURL(blob);
  });
}

export async function prepareAvatar(file: File) {
  if (!ACCEPTED_TYPES.has(file.type))
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  if (file.size > MAX_SOURCE_BYTES)
    throw new Error("Choose an image smaller than 8 MB.");

  const image = await loadImage(file);
  if (!image.naturalWidth || !image.naturalHeight)
    throw new Error("This image has no visible content.");
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - sourceSize) / 2;
  const sourceY = (image.naturalHeight - sourceSize) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not prepare the image.");
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );
  const blob = await canvasBlob(canvas);
  if (blob.type !== "image/webp")
    throw new Error("This browser does not support WebP avatars.");
  if (blob.size > MAX_AVATAR_BYTES)
    throw new Error("The prepared image is too complex. Choose another image.");
  return dataUrl(blob);
}
