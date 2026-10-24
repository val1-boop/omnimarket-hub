"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { pesosToCents } from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validation/product";
import { SESSION_EXPIRED_MESSAGE } from "@/server/auth-guard";
import { getStoreContext } from "@/server/store";

const PRODUCT_NOT_FOUND = "Ese producto ya no existe en esta tienda. Recarga la página.";

function revalidateCatalog() {
  revalidatePath("/productos");
  revalidatePath("/pedidos/nuevo");
}

// El SKU se arma solo: OM-<3 letras de la categoría>-<consecutivo dentro de la tienda>.
async function nextSku(storeId: string, category: string) {
  const products = await prisma.product.findMany({ where: { storeId }, select: { sku: true } });
  const lastNumber = products.reduce((max, { sku }) => Math.max(max, Number(sku.split("-").at(-1)) || 0), 0);
  return `OM-${category.slice(0, 3).toUpperCase()}-${String(lastNumber + 1).padStart(3, "0")}`;
}

export async function createProduct(input: unknown): Promise<ActionResult<{ id: string; name: string }>> {
  const context = await getStoreContext();
  if (!context) return { ok: false, message: SESSION_EXPIRED_MESSAGE };
  const storeId = context.store.id;

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { name, category, price, cost, stock } = parsed.data;

  try {
    const product = await prisma.product.create({
      data: {
        storeId,
        name,
        category,
        sku: await nextSku(storeId, category),
        priceCents: pesosToCents(price),
        costCents: pesosToCents(cost),
        stock,
      },
    });
    revalidateCatalog();
    return { ok: true, data: { id: product.id, name: product.name } };
  } catch (error) {
    console.error("[products.createProduct]", error);
    return { ok: false, message: "No pudimos guardar el producto. Inténtalo otra vez." };
  }
}

export async function updateProduct(id: string, input: unknown): Promise<ActionResult<{ name: string }>> {
  const context = await getStoreContext();
  if (!context) return { ok: false, message: SESSION_EXPIRED_MESSAGE };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { name, category, price, cost, stock } = parsed.data;

  try {
    // Solo se actualiza si el producto es de esta tienda.
    const { count } = await prisma.product.updateMany({
      where: { id, storeId: context.store.id },
      data: { name, category, priceCents: pesosToCents(price), costCents: pesosToCents(cost), stock },
    });
    if (count === 0) return { ok: false, message: PRODUCT_NOT_FOUND };
    revalidateCatalog();
    return { ok: true, data: { name } };
  } catch (error) {
    console.error("[products.updateProduct]", error);
    return { ok: false, message: "No pudimos guardar los cambios. Inténtalo otra vez." };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult<{ name: string }>> {
  const context = await getStoreContext();
  if (!context) return { ok: false, message: SESSION_EXPIRED_MESSAGE };

  const product = await prisma.product.findFirst({ where: { id, storeId: context.store.id }, select: { name: true } });
  if (!product) return { ok: false, message: PRODUCT_NOT_FOUND };

  const usedInOrders = await prisma.orderItem.count({ where: { productId: id } });
  if (usedInOrders > 0) {
    return {
      ok: false,
      message: "Este producto ya aparece en pedidos, así que no lo podemos borrar. Puedes dejar su inventario en 0.",
    };
  }

  try {
    await prisma.product.deleteMany({ where: { id, storeId: context.store.id } });
    revalidateCatalog();
    return { ok: true, data: { name: product.name } };
  } catch (error) {
    console.error("[products.deleteProduct]", error);
    return { ok: false, message: "No pudimos borrar el producto. Inténtalo otra vez." };
  }
}