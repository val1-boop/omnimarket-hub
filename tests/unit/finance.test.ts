import { describe, expect, it } from "vitest";
import {
  calculateAverageTicket,
  calculateMargin,
  calculateOrderTotals,
  calculateProfit,
  centsToPesos,
  pesosToCents,
} from "@/lib/finance";

describe("cálculos financieros", () => {
  it("calcula el margen como la parte del precio que es ganancia", () => {
    expect(calculateMargin(10_000, 6_000)).toBeCloseTo(0.4);
    expect(calculateMargin(189_900, 112_000)).toBeCloseTo(0.4102, 4);
  });

  it("regresa margen 0 cuando el precio es 0 (no divide entre cero)", () => {
    expect(calculateMargin(0, 500)).toBe(0);
  });

  it("calcula la ganancia por pieza y por varias piezas", () => {
    expect(calculateProfit(29_900, 9_000)).toBe(20_900);
    expect(calculateProfit(29_900, 9_000, 3)).toBe(62_700);
  });

  it("suma total, costo y ganancia de las líneas de un pedido", () => {
    const totals = calculateOrderTotals([
      { quantity: 2, unitPriceCents: 29_900, unitCostCents: 9_000 },
      { quantity: 1, unitPriceCents: 49_900, unitCostCents: 19_000 },
    ]);
    expect(totals).toEqual({ totalCents: 109_700, costCents: 37_000, profitCents: 72_700 });
  });

  it("calcula el ticket promedio redondeado al centavo y 0 si no hay pedidos", () => {
    expect(calculateAverageTicket([10_000, 20_000, 30_001])).toBe(20_000);
    expect(calculateAverageTicket([])).toBe(0);
  });

  it("convierte pesos a centavos sin errores de punto flotante", () => {
    expect(pesosToCents(0.1 + 0.2)).toBe(30);
    expect(pesosToCents(1899.9)).toBe(189_990);
    expect(centsToPesos(189_990)).toBe(1899.9);
  });
});
