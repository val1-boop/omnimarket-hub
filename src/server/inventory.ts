import type { Prisma } from "@prisma/client";
import { piecesByProduct } from "@/lib/inventory";

type Tx = Prisma.TransactionClient;

/** Error con un mensaje listo para mostrar a la persona (por ejemplo, "Solo quedan 2 piezas de …"). */
export class StockError extends Error {}

/**
 * Aparta piezas del inventario. Cada resta solo se hace si alcanzan las piezas
 * (stock >= cantidad), así dos pedidos al mismo tiempo nunca dejan el inventario en negativo.
 * Debe llamarse dentro de una transacción: si un producto no alcanza, se deshace todo.
 */
export async function takeStock(tx: Tx, storeId: string, lines: { productId: string; quantity: number }[]) {
  for (const [productId, quantity] of piecesByProduct(lines)) {
    const { count } = await tx.product.updateMany({
      where: { id: productId, storeId, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (count === 0) {
      const product = await tx.product.findFirst({ where: { id: productId, storeId }, select: { name: true, stock: true } });
      if (!product) throw new StockError("Uno de los productos ya no existe. Recarga la página e inténtalo otra vez.");
      throw new StockError(
        product.stock <= 0
          ? `“${product.name}” está agotado.`
          : `Solo ${product.stock === 1 ? "queda 1 pieza" : `quedan ${product.stock} piezas`} de “${product.name}”.`,
      );
    }
  }
}

/** Regresa al inventario las piezas de unos pedidos (al cancelarlos o borrarlos). */
export async function returnStock(tx: Tx, storeId: string, lines: { productId: string; quantity: number }[]) {
  for (const [productId, quantity] of piecesByProduct(lines)) {
    await tx.product.updateMany({ where: { id: productId, storeId }, data: { stock: { increment: quantity } } });
  }
}

/**
 * Bloquea unos pedidos hasta que termine la transacción. Así, si dos personas cancelan
 * el mismo pedido al mismo tiempo, la segunda espera y ve que ya estaba cancelado
 * (las piezas no se regresan dos veces).
 */
export async function lockOrders(tx: Tx, storeId: string, ids: string[]) {
  await tx.$queryRaw`SELECT id FROM "Order" WHERE "storeId" = ${storeId} AND id = ANY(${ids}) FOR UPDATE`;
}
