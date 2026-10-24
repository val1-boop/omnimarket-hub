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

/** Valor especial del selector de cliente: el cliente se crea junto con el pedido. */
export const NEW_CUSTOMER = "nuevo";

export const newCustomerSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del cliente").max(80, "Máximo 80 letras"),
  city: z.string().trim().min(2, "Escribe la ciudad").max(60, "Máximo 60 letras"),
});

const isNewCustomer = (payload: { value: unknown }) =>
  (payload.value as { customerId?: unknown } | undefined)?.customerId === NEW_CUSTOMER;

export const orderSchema = z
  .object({
    customerId: z.string().min(1, "Elige a quién le vendes"),
    // Solo cuenta si se eligió "Cliente nuevo"; si no, se ignora.
    newCustomer: z.object({ name: z.string().optional(), city: z.string().optional() }).optional(),
    items: z
      .array(orderItemSchema)
      .min(1, "Agrega al menos un producto")
      .max(20, "Máximo 20 productos por pedido"),
  })
  .refine((order) => new Set(order.items.map((item) => item.productId)).size === order.items.length, {
    path: ["items"],
    message: "Repetiste un producto: mejor súbele a la cantidad",
  })
  // "when": estas revisiones corren aunque otros campos tengan errores, así se ven todos de una vez.
  .refine((order) => newCustomerSchema.shape.name.safeParse(order.newCustomer?.name ?? "").success, {
    path: ["newCustomer", "name"],
    message: "Escribe el nombre del cliente (de 2 a 80 letras)",
    when: isNewCustomer,
  })
  .refine((order) => newCustomerSchema.shape.city.safeParse(order.newCustomer?.city ?? "").success, {
    path: ["newCustomer", "city"],
    message: "Escribe la ciudad (de 2 a 60 letras)",
    when: isNewCustomer,
  })
  .transform((order) => ({
    ...order,
    newCustomer: order.customerId === NEW_CUSTOMER ? newCustomerSchema.parse(order.newCustomer) : undefined,
  }));

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

export type OrderInput = z.input<typeof orderSchema>;
export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>;

export type MoveOrderInput = z.infer<typeof moveOrderSchema>;
