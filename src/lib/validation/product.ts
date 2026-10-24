import { z } from "zod";

export const PRODUCT_CATEGORIES = ["Belleza", "Computación", "Deportes", "Electrónica", "Hogar", "Ropa"] as const;

// Dinero escrito en pesos, con máximo dos decimales.
function pesos(emptyMessage: string) {
  return z
    .number({ error: emptyMessage })
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, "Usa máximo dos decimales");
}

export const productSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "El nombre necesita al menos 3 letras")
      .max(80, "El nombre es muy largo (máximo 80 letras)"),
    category: z.enum(PRODUCT_CATEGORIES, { error: "Elige una categoría" }),
    price: pesos("Escribe el precio").refine((value) => value > 0, "El precio tiene que ser mayor a $0"),
    cost: pesos("Escribe cuánto te cuesta").refine((value) => value >= 0, "El costo no puede ser negativo"),
    stock: z
      .number({ error: "Escribe cuántas piezas tienes" })
      .int("Escribe un número entero")
      .min(0, "No puede ser negativo")
      .max(100_000, "Es demasiado inventario"),
  })
  .refine((product) => product.cost <= product.price, {
    path: ["cost"],
    message: "El costo no puede ser mayor que el precio: perderías dinero en cada venta",
  });

export type ProductInput = z.infer<typeof productSchema>;