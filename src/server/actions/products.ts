"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { pesosToCents } from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validation/product";
import { getSessionUser, SESSION_EXPIRED_MESSAGE } from "@/server/auth-guard";

function revalidateCatalog() {
  revalidatePath("/productos");
  revalidatePath("/pedidos/nuevo");
}

// El SKU se arma solo: OM-<3 letras de la categoría>-<consecutivo>.
async function nextSku(category: string) {
  const products = await prisma.product.findMany({ select: { sku: true } });
  const lastNumber = products.reduce((max, { sku }) => Math.max(max, Number(sku.split("-").at(-1)) || 0), 0);
  return `OM-${category.slice(0, 3).toUpperCase()}-${String(lastNumber + 1).padStart(3, "0")}`;
}

export async function createProduct(input: unknown): Promise<ActionResult<{ id: string; name: string }>> {
  if (!(await getSessionUser())) return { ok: false, message: SESSION_EXPIRED_MESSAGE };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { name, category, price, cost, stock } = parsed.data;

  try {
    const product = await prisma.product.create({
      data: {
        name,
        category,
        sku: await nextSku(category),
        priceCents: pesosToCents(price),
        costCents: pesosToCents(cost),
        stock,
      },
    });
    revalidateCatalog();
    return { ok: true, data: { id: product.id, name: product.name } };
  } catch {
    return { ok: false, message: "No pudimos guardar el producto. Inténtalo otra vez." };
  }
}

export async function updateProduct(id: string, input: unknown): Promise<ActionResult<{ name: string }>> {
  if (!(await getSessionUser())) return { ok: false, message: SESSION_EXPIRED_MESSAGE };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { name, category, price, cost, stock } = parsed.data;

  try {
    const product = await prisma.product.update({
      where: { id },
      data: { name, category, priceCents: pesosToCents(price), costCents: pesosToCents(cost), stock },
    });
    revalidateCatalog();
    return { ok: true, data: { name: product.name } };
  } catch {
    return { ok: false, message: "No pudimos guardar los cambios. Inténtalo otra vez." };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult<{ name: string }>> {
  if (!(await getSessionUser())) return { ok: false, message: SESSION_EXPIRED_MESSAGE };

  const usedInOrders = await prisma.orderItem.count({ where: { productId: id } });
  if (usedInOrders > 0) {
    return {
      ok: false,
      message: "Este producto ya aparece en pedidos, así que no lo podemos borrar. Puedes dejar su inventario en 0.",
    };
  }

  try {
    const product = await prisma.product.delete({ where: { id } });
    revalidateCatalog();
    return { ok: true, data: { name: product.name } };
  } catch {
    return { ok: false, message: "No pudimos borrar el producto. Inténtalo otra vez." };
  }
}