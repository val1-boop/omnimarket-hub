import { describe, expect, it } from "vitest";
import { holdsStock, isLowStock, LOW_STOCK_LIMIT, piecesByProduct, stockDirection, stockLabel } from "@/lib/inventory";

describe("inventario", () => {
  it("todos los pedidos apartan piezas, menos los cancelados", () => {
    expect(holdsStock("PENDING")).toBe(true);
    expect(holdsStock("DELIVERED")).toBe(true);
    expect(holdsStock("CANCELLED")).toBe(false);
  });

  it("al cancelar regresan piezas, al reactivar se vuelven a apartar y entre pasos normales no cambia", () => {
    expect(stockDirection("PROCESSING", "CANCELLED")).toBe(1);
    expect(stockDirection("CANCELLED", "PENDING")).toBe(-1);
    expect(stockDirection("PENDING", "SHIPPED")).toBe(0);
    expect(stockDirection("CANCELLED", "CANCELLED")).toBe(0);
  });

  it("marca como 'por agotarse' de 1 a 5 piezas; con 0 está agotado", () => {
    expect(LOW_STOCK_LIMIT).toBe(5);
    expect(isLowStock(0)).toBe(false);
    expect(isLowStock(1)).toBe(true);
    expect(isLowStock(5)).toBe(true);
    expect(isLowStock(6)).toBe(false);
  });

  it("escribe el texto corto del inventario", () => {
    expect(stockLabel(0)).toBe("Agotado");
    expect(stockLabel(1)).toBe("Queda 1");
    expect(stockLabel(4)).toBe("Quedan 4");
    expect(stockLabel(30)).toBe("30 en inventario");
  });

  it("suma las piezas de un mismo producto aunque vengan en varias líneas", () => {
    const pieces = piecesByProduct([
      { productId: "a", quantity: 2 },
      { productId: "b", quantity: 1 },
      { productId: "a", quantity: 3 },
    ]);
    expect([...pieces]).toEqual([
      ["a", 5],
      ["b", 1],
    ]);
  });
});
