"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { calculateOrderTotals } from "@/lib/finance";
import { holdsStock, stockDirection } from "@/lib/inventory";
import { prisma } from "@/lib/prisma";
import { bulkDeleteSchema, bulkUpdateSchema, moveOrderSchema, NEW_CUSTOMER, orderSchema } from "@/lib/validation/order";
import { SESSION_EXPIRED_MESSAGE } from "@/server/auth-guard";
import { lockOrders, returnStock, StockError, takeStock } from "@/server/inventory";
import { getStoreContext } from "@/server/store";

function revalidateOrders() {
  revalidatePath("/pedidos");
  revalidatePath("/kanban");
  revalidatePath("/dashboard");
  // El inventario y las compras de cada cliente cambian con los pedidos.
  revalidatePath("/productos");
  revalidatePath("/clientes");
}

const ITEMS_FOR_STOCK = { status: true, items: { select: { productId: true, quantity: true } } } as const;

// Todas las acciones toman la tienda de la sesión (en el servidor) y solo tocan registros de esa tienda.
// Si alguien manda el id de un pedido o producto de otra tienda, simplemente no se encuentra.

export async function createOrder(input: unknown): Promise<ActionResult<{ number: number }>> {
  const context = await getStoreContext();
  if (!context) return { ok: false, message: SESSION_EXPIRED_MESSAGE };
  const storeId = context.store.id;

  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { customerId, newCustomer, items } = parsed.data;

  // El cliente elegido tiene que ser de esta tienda.
  if (customerId !== NEW_CUSTOMER) {
    const customer = await prisma.customer.findFirst({ where: { id: customerId, storeId }, select: { id: true } });
    if (!customer) return { ok: false, message: "Ese cliente ya no existe. Recarga la página e inténtalo otra vez." };
  }

  // Los precios se toman de la base de datos, nunca de lo que mande el navegador.
  const products = await prisma.product.findMany({
    where: { storeId, id: { in: items.map((item) => item.productId) } },
    select: { id: true, priceCents: true, costCents: true },
  });
  if (products.length !== items.length) {
    return { ok: false, message: "Uno de los productos ya no existe. Recarga la página e inténtalo otra vez." };
  }

  const lines = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    return {
      productId: product.id,
      quantity: item.quantity,
      unitPriceCents: product.priceCents,
      unitCostCents: product.costCents,
    };
  });
  const { totalCents, costCents } = calculateOrderTotals(lines);

  try {
    // Todo o nada: se apartan las piezas y se crea el pedido; si algo no alcanza, no se guarda nada.
    const order = await prisma.$transaction(async (tx) => {
      await takeStock(tx, storeId, lines);
      // El pedido nuevo aparece hasta arriba de la columna "Por preparar".
      const { _min } = await tx.order.aggregate({ where: { storeId, status: "PENDING" }, _min: { position: true } });
      return tx.order.create({
        data: {
          store: { connect: { id: storeId } },
          // "Cliente nuevo": se crea junto con el pedido, en la misma tienda.
          customer:
            customerId === NEW_CUSTOMER
              ? { create: { storeId, name: newCustomer!.name, city: newCustomer!.city } }
              : { connect: { id: customerId } },
          status: "PENDING",
          position: (_min.position ?? 1) - 1,
          totalCents,
          costCents,
          items: { create: lines },
        },
      });
    });
    revalidateOrders();
    return { ok: true, data: { number: order.number } };
  } catch (error) {
    if (error instanceof StockError) return { ok: false, message: error.message };
    console.error("[orders.createOrder]", error);
    return { ok: false, message: "No pudimos crear el pedido. Inténtalo otra vez." };
  }
}

export async function bulkUpdateOrderStatus(input: unknown): Promise<ActionResult<{ count: number }>> {
  const context = await getStoreContext();
  if (!context) return { ok: false, message: SESSION_EXPIRED_MESSAGE };

  const parsed = bulkUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const storeId = context.store.id;
  const { ids, status } = parsed.data;

  try {
    const count = await prisma.$transaction(async (tx) => {
      await lockOrders(tx, storeId, ids);
      const orders = await tx.order.findMany({ where: { storeId, id: { in: ids } }, select: ITEMS_FOR_STOCK });
      // Los que se cancelan regresan sus piezas; los que salen de "Cancelado" las vuelven a apartar.
      await returnStock(tx, storeId, orders.filter((o) => stockDirection(o.status, status) === 1).flatMap((o) => o.items));
      await takeStock(tx, storeId, orders.filter((o) => stockDirection(o.status, status) === -1).flatMap((o) => o.items));
      const { count } = await tx.order.updateMany({ where: { storeId, id: { in: ids } }, data: { status } });
      return count;
    });
    revalidateOrders();
    return { ok: true, data: { count } };
  } catch (error) {
    if (error instanceof StockError) return { ok: false, message: `No se pudo reactivar: ${error.message}` };
    console.error("[orders.bulkUpdateOrderStatus]", error);
    return { ok: false, message: "No pudimos guardar el cambio." };
  }
}

export async function bulkDeleteOrders(input: unknown): Promise<ActionResult<{ count: number }>> {
  const context = await getStoreContext();
  if (!context) return { ok: false, message: SESSION_EXPIRED_MESSAGE };

  const parsed = bulkDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const storeId = context.store.id;
  const where = { storeId, id: { in: parsed.data.ids } };

  try {
    const count = await prisma.$transaction(async (tx) => {
      await lockOrders(tx, storeId, parsed.data.ids);
      // Las piezas de los pedidos que no estaban cancelados regresan al inventario.
      const orders = await tx.order.findMany({ where, select: ITEMS_FOR_STOCK });
      await returnStock(tx, storeId, orders.filter((o) => holdsStock(o.status)).flatMap((o) => o.items));
      const { count } = await tx.order.deleteMany({ where });
      return count;
    });
    revalidateOrders();
    return { ok: true, data: { count } };
  } catch (error) {
    console.error("[orders.bulkDeleteOrders]", error);
    return { ok: false, message: "No pudimos borrar los pedidos." };
  }
}


// Mueve un pedido a otro paso desde el tablero. Al cambiar, se actualiza su fecha de
// modificación y por eso queda hasta arriba de la columna nueva.
export async function moveOrder(input: unknown): Promise<ActionResult<{ number: number }>> {
  const context = await getStoreContext();
  if (!context) return { ok: false, message: SESSION_EXPIRED_MESSAGE };

  const parsed = moveOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const storeId = context.store.id;
  const { id, status } = parsed.data;

  try {
    const order = await prisma.$transaction(async (tx) => {
      await lockOrders(tx, storeId, [id]);
      const order = await tx.order.findFirst({ where: { id, storeId }, select: { number: true, ...ITEMS_FOR_STOCK } });
      if (!order) return null;
      const direction = stockDirection(order.status, status);
      if (direction === 1) await returnStock(tx, storeId, order.items);
      if (direction === -1) await takeStock(tx, storeId, order.items);
      await tx.order.updateMany({ where: { id, storeId }, data: { status } });
      return order;
    });
    if (!order) return { ok: false, message: "Ese pedido ya no existe en esta tienda." };
    revalidateOrders();
    return { ok: true, data: { number: order.number } };
  } catch (error) {
    if (error instanceof StockError) return { ok: false, message: `No se pudo reactivar: ${error.message}` };
    console.error("[orders.moveOrder]", error);
    return { ok: false, message: "No pudimos mover el pedido." };
  }
}