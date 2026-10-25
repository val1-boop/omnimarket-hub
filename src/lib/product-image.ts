// Fotos de productos: reglas compartidas por el navegador (al reducir la foto) y el servidor (al guardarla).

/** La foto se reduce en el navegador a este tamaño máximo (lado más largo, en píxeles). */
export const PRODUCT_IMAGE_MAX_SIDE = 800;

/** Tamaño máximo que acepta el servidor ya reducida: una foto de 800 px en WebP pesa unos 60–150 KB. */
export const PRODUCT_IMAGE_MAX_BYTES = 600 * 1024;

export type ProductImageType = "image/webp" | "image/jpeg" | "image/png";

/**
 * Revisa los primeros bytes del archivo para saber qué tipo de imagen es de verdad
 * (no se confía en el nombre ni en lo que diga el navegador). Si no es WebP, JPEG o PNG, regresa null.
 */
export function detectImageType(bytes: Uint8Array): ProductImageType | null {
  const startsWith = (signature: number[], offset = 0) => signature.every((byte, index) => bytes[offset + index] === byte);
  if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // WebP: "RIFF" + 4 bytes de tamaño + "WEBP"
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}

/** Dirección de la foto de un producto, o null si no tiene. La fecha hace que el navegador pida la nueva al cambiarla. */
export function productImageUrl(product: { id: string; imageUpdatedAt: Date | null }): string | null {
  return product.imageUpdatedAt ? `/api/productos/${product.id}/foto?v=${product.imageUpdatedAt.getTime()}` : null;
}
