"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { calculateOrderTotals } from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { bulkDeleteSchema, bulkUpdateSchema, moveOrderSchema, orderSchema } from "@/lib/validation/order";import { getSessionUser, SESSION_EXPIRED_MESSAGE } from "@/server/auth-guard";

function revalidateOrders() {
  revalidatePath("/pedidos");
  revalidatePath("/kanban");
  revalidatePath("/dashboard");
}

export async function createOrder(input: unknown): Promise<ActionResult<{ number: number }>> {
  if (!(await getSessionUser())) return { ok: false, message: SESSION_EXPIRED_MESSAGE };

  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { customerId, items } = parsed.data;

  // Los precios se toman de la base de datos, nunca de lo que mande el navegador.
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((item) => item.productId) } },
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
    // El pedido nuevo aparece hasta arriba de la columna "Por preparar".
    const { _min } = await prisma.order.aggregate({ where: { status: "PENDING" }, _min: { position: true } });
    const order = await prisma.order.create({
      data: {
        customerId,
        status: "PENDING",
        position: (_min.position ?? 1) - 1,
        totalCents,
        costCents,
        items: { create: lines },
      },
    });
    revalidateOrders();
    return { ok: true, data: { number: order.number } };
  } catch (error) {
    console.error("[orders.createOrder]", error);
    return { ok: false, message: "No pudimos crear el pedido. Inténtalo otra vez." };
  }
}

export async function bulkUpdateOrderStatus(input: unknown): Promise<ActionResult<{ count: number }>> {
  if (!(await getSessionUser())) return { ok: false, message: SESSION_EXPIRED_MESSAGE };

  const parsed = bulkUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  try {
    const { count } = await prisma.order.updateMany({
      where: { id: { in: parsed.data.ids } },
      data: { status: parsed.data.status },
    });
    revalidateOrders();
    return { ok: true, data: { count } };
  } catch (error) {
    console.error("[orders.bulkUpdateOrderStatus]", error);
    return { ok: false, message: "No pudimos guardar el cambio." };
  }
}

export async function bulkDeleteOrders(input: unknown): Promise<ActionResult<{ count: number }>> {
  if (!(await getSessionUser())) return { ok: false, message: SESSION_EXPIRED_MESSAGE };

  const parsed = bulkDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  try {
    const { count } = await prisma.order.deleteMany({ where: { id: { in: parsed.data.ids } } });
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
  if (!(await getSessionUser())) return { ok: false, message: SESSION_EXPIRED_MESSAGE };

  const parsed = moveOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  try {
    const order = await prisma.order.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
      select: { number: true },
    });
    revalidateOrders();
    return { ok: true, data: { number: order.number } };
  } catch (error) {
    console.error("[orders.moveOrder]", error);
    return { ok: false, message: "No pudimos mover el pedido." };
  }
}