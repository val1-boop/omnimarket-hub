import { z } from "zod";
import { ORDER_STATUSES } from "@/lib/order-status";

export const orderItemSchema = z.object({
  productId: z.string().min(1, "Elige un producto"),
  quantity: z
    .number({ error: "Escribe la cantidad" })
    .int("Solo números enteros")
    .min(1, "Mínimo 1 pieza")
    .max(99, "Máximo 99 piezas"),
});

export const orderSchema = z
  .object({
    customerId: z.string().min(1, "Elige a quién le vendes"),
    items: z
      .array(orderItemSchema)
      .min(1, "Agrega al menos un producto")
      .max(20, "Máximo 20 productos por pedido"),
  })
  .refine((order) => new Set(order.items.map((item) => item.productId)).size === order.items.length, {
    path: ["items"],
    message: "Repetiste un producto: mejor súbele a la cantidad",
  });

const orderIdsSchema = z
  .array(z.string().min(1))
  .min(1, "Elige al menos un pedido")
  .max(100, "Puedes cambiar máximo 100 pedidos a la vez");

export const bulkUpdateSchema = z.object({
  ids: orderIdsSchema,
  status: z.enum(ORDER_STATUSES, { error: "Elige a qué paso los quieres mover" }),
});

export const bulkDeleteSchema = z.object({ ids: orderIdsSchema });


export const moveOrderSchema = z.object({
  id: z.string().min(1, "Falta el pedido"),
  status: z.enum(ORDER_STATUSES, { error: "Ese paso no existe" }),
});

export type OrderInput = z.infer<typeof orderSchema>;
export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>;

export type MoveOrderInput = z.infer<typeof moveOrderSchema>;
