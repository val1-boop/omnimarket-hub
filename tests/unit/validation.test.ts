import { describe, expect, it } from "vitest";
import { bulkUpdateSchema, moveOrderSchema, orderSchema } from "@/lib/validation/order";
import { productSchema } from "@/lib/validation/product";
import { analyticsQuerySchema } from "@/lib/validation/test-api";

const validProduct = { name: "Termo de acero 750 ml", category: "Hogar", price: 100, cost: 60.5, stock: 12 };

const firstError = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe("esquemas Zod de entrada", () => {
  it("acepta un producto válido y limpia los espacios del nombre", () => {
    const result = productSchema.safeParse({ ...validProduct, name: "  Termo de acero 750 ml  " });
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("Termo de acero 750 ml");
  });

  it("rechaza un producto cuyo costo es mayor que su precio", () => {
    const result = productSchema.safeParse({ ...validProduct, cost: 150 });
    expect(result.success).toBe(false);
    expect(firstError(result)).toBe("El costo no puede ser mayor que el precio: perderías dinero en cada venta");
    expect(result.error?.issues[0].path).toEqual(["cost"]);
  });

  it("rechaza precios con más de dos decimales, categorías inexistentes e inventario negativo", () => {
    expect(firstError(productSchema.safeParse({ ...validProduct, price: 10.999 }))).toBe("Usa máximo dos decimales");
    expect(firstError(productSchema.safeParse({ ...validProduct, category: "Juguetes" }))).toBe("Elige una categoría");
    expect(firstError(productSchema.safeParse({ ...validProduct, stock: -1 }))).toBe("No puede ser negativo");
  });

  it("rechaza un pedido sin cliente, sin productos o con productos repetidos", () => {
    expect(firstError(orderSchema.safeParse({ customerId: "", items: [{ productId: "p1", quantity: 1 }] }))).toBe(
      "Elige a quién le vendes",
    );
    expect(firstError(orderSchema.safeParse({ customerId: "c1", items: [] }))).toBe("Agrega al menos un producto");
    const repeated = orderSchema.safeParse({
      customerId: "c1",
      items: [
        { productId: "p1", quantity: 1 },
        { productId: "p1", quantity: 2 },
      ],
    });
    expect(firstError(repeated)).toBe("Repetiste un producto: mejor súbele a la cantidad");
  });

  it("valida la edición en lote y el movimiento en el tablero", () => {
    expect(bulkUpdateSchema.safeParse({ ids: ["a", "b"], status: "SHIPPED" }).success).toBe(true);
    expect(firstError(bulkUpdateSchema.safeParse({ ids: [], status: "SHIPPED" }))).toBe("Elige al menos un pedido");
    expect(moveOrderSchema.safeParse({ id: "a", status: "PERDIDO" }).success).toBe(false);
  });

  it("valida los parámetros de paginación de la API de métricas", () => {
    expect(analyticsQuerySchema.parse({})).toEqual({ page: 1, limit: 50 });
    expect(analyticsQuerySchema.parse({ page: "3", limit: "20" })).toEqual({ page: 3, limit: 20 });
    expect(analyticsQuerySchema.safeParse({ limit: "500" }).success).toBe(false);
  });
});
