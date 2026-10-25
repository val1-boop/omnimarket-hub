"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validation/customer";
import { SESSION_EXPIRED_MESSAGE } from "@/server/auth-guard";
import { getStoreContext } from "@/server/store";

const CUSTOMER_NOT_FOUND = "Ese cliente ya no existe en esta tienda. Recarga la página.";
const EMAIL_TAKEN = "Ya tienes un cliente con ese correo.";

function revalidateCustomers() {
  revalidatePath("/clientes");
  revalidatePath("/pedidos");
  revalidatePath("/pedidos/nuevo");
}

const isEmailTaken = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

export async function createCustomer(input: unknown): Promise<ActionResult<{ id: string; name: string }>> {
  const context = await getStoreContext();
  if (!context) return { ok: false, message: SESSION_EXPIRED_MESSAGE };

  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  try {
    const customer = await prisma.customer.create({ data: { storeId: context.store.id, ...parsed.data } });
    revalidateCustomers();
    return { ok: true, data: { id: customer.id, name: customer.name } };
  } catch (error) {
    if (isEmailTaken(error)) return { ok: false, message: EMAIL_TAKEN };
    console.error("[customers.createCustomer]", error);
    return { ok: false, message: "No pudimos guardar al cliente. Inténtalo otra vez." };
  }
}

export async function updateCustomer(id: string, input: unknown): Promise<ActionResult<{ name: string }>> {
  const context = await getStoreContext();
  if (!context) return { ok: false, message: SESSION_EXPIRED_MESSAGE };

  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  try {
    const { count } = await prisma.customer.updateMany({ where: { id, storeId: context.store.id }, data: parsed.data });
    if (count === 0) return { ok: false, message: CUSTOMER_NOT_FOUND };
    revalidateCustomers();
    return { ok: true, data: { name: parsed.data.name } };
  } catch (error) {
    if (isEmailTaken(error)) return { ok: false, message: EMAIL_TAKEN };
    console.error("[customers.updateCustomer]", error);
    return { ok: false, message: "No pudimos guardar los cambios. Inténtalo otra vez." };
  }
}

// Solo se puede borrar un cliente sin pedidos: así no se pierde el historial de ventas.
export async function deleteCustomer(id: string): Promise<ActionResult<{ name: string }>> {
  const context = await getStoreContext();
  if (!context) return { ok: false, message: SESSION_EXPIRED_MESSAGE };
  const where = { id, storeId: context.store.id };

  try {
    const customer = await prisma.customer.findFirst({ where, select: { name: true, _count: { select: { orders: true } } } });
    if (!customer) return { ok: false, message: CUSTOMER_NOT_FOUND };
    if (customer._count.orders > 0) {
      return { ok: false, message: "No se puede borrar: tiene pedidos. Así no se pierde tu historial de ventas." };
    }
    await prisma.customer.deleteMany({ where });
    revalidateCustomers();
    return { ok: true, data: { name: customer.name } };
  } catch (error) {
    // Si justo le crearon un pedido, la base de datos no deja borrarlo.
    console.error("[customers.deleteCustomer]", error);
    return { ok: false, message: "No pudimos borrar al cliente. Recarga la página e inténtalo otra vez." };
  }
}
