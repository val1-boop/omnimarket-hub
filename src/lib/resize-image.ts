import { PRODUCT_IMAGE_MAX_SIDE } from "@/lib/product-image";

/**
 * Reduce una foto en el navegador antes de subirla: máximo 800 px por lado, en WebP
 * (o JPEG si el navegador no sabe hacer WebP). Una foto de celular de 4 MB queda en ~100 KB.
 */
export async function resizeImage(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("No pudimos abrir esa imagen. Usa una foto JPG, PNG o WebP.");
  }
  const scale = Math.min(1, PRODUCT_IMAGE_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Tu navegador no pudo preparar la foto.");
  // Fondo blanco: las fotos PNG con partes transparentes no quedan negras en JPEG.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const toBlob = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  const webp = await toBlob("image/webp");
  const blob = webp?.type === "image/webp" ? webp : await toBlob("image/jpeg");
  if (!blob) throw new Error("Tu navegador no pudo preparar la foto.");
  return blob;
}
