// Reglas del inventario. Un pedido "aparta" sus piezas desde que se crea; si se cancela,
// las piezas regresan al inventario, y si se reactiva se vuelven a apartar.
import type { OrderStatus } from "@prisma/client";

/** Con 5 piezas o menos, el producto aparece como "por agotarse". */
export const LOW_STOCK_LIMIT = 5;

/** ¿Este pedido tiene piezas apartadas? Todos menos los cancelados. */
export function holdsStock(status: OrderStatus): boolean {
  return status !== "CANCELLED";
}

/**
 * Qué le pasa al inventario al cambiar un pedido de paso:
 * -1 = se apartan piezas (sale de cancelado), +1 = regresan piezas (se cancela), 0 = nada.
 */
export function stockDirection(from: OrderStatus, to: OrderStatus): -1 | 0 | 1 {
  if (holdsStock(from) === holdsStock(to)) return 0;
  return holdsStock(to) ? -1 : 1;
}

export function isLowStock(stock: number): boolean {
  return stock > 0 && stock <= LOW_STOCK_LIMIT;
}

/** Texto corto para la tarjeta del producto. */
export function stockLabel(stock: number): string {
  if (stock <= 0) return "Agotado";
  if (stock === 1) return "Queda 1";
  return isLowStock(stock) ? `Quedan ${stock}` : `${stock} en inventario`;
}

/** Suma las piezas por producto (un pedido puede traer varias líneas). */
export function piecesByProduct(lines: { productId: string; quantity: number }[]): Map<string, number> {
  const pieces = new Map<string, number>();
  for (const line of lines) pieces.set(line.productId, (pieces.get(line.productId) ?? 0) + line.quantity);
  return pieces;
}
