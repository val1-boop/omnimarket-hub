import { describe, expect, it } from "vitest";
import {
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatDayKey,
  formatNumber,
  formatOrderNumber,
  formatPercent,
} from "@/lib/format";

describe("formateadores de moneda y texto", () => {
  it("formatea centavos como pesos mexicanos", () => {
    expect(formatCurrency(189_900)).toBe("$1,899.00");
    expect(formatCurrency(5)).toBe("$0.05");
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("abrevia cantidades grandes para los ejes de las gráficas", () => {
    expect(formatCompactCurrency(95_000)).toBe("$950");
    expect(formatCompactCurrency(1_250_000)).toBe("$12.5 mil");
    expect(formatCompactCurrency(4_000_000)).toBe("$40 mil");
    expect(formatCompactCurrency(125_000_000)).toBe("$1.3 M");
  });

  it("formatea números y porcentajes con el formato de México", () => {
    expect(formatNumber(12_500)).toBe("12,500");
    expect(formatPercent(0.4123)).toBe("41.2%");
    expect(formatPercent(0.4, 0)).toBe("40%");
  });

  it("arma el número de pedido con ceros a la izquierda", () => {
    expect(formatOrderNumber(42)).toBe("OM-00042");
    expect(formatOrderNumber(300)).toBe("OM-00300");
  });

  it("muestra las fechas con el horario de la Ciudad de México", () => {
    // 03:00 en UTC todavía es el día anterior en México (UTC-6).
    expect(formatDate("2026-10-24T03:00:00Z")).toBe("23 oct 2026");
    expect(formatDayKey("2026-10-24")).toBe("24 oct");
    expect(formatDayKey("2026-10-24", "long")).toBe("sábado, 24 de octubre");
  });
});
