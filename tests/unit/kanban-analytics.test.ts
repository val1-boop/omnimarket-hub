import { describe, expect, it } from "vitest";
import { calculateChange, fillDailySeries, getPeriodRange, parsePeriod } from "@/lib/analytics";
import { getNextStatus, moveCard, type KanbanColumn } from "@/lib/kanban";

const card = (id: string, number: number) => ({
  id,
  number,
  customerName: "Ana García",
  totalCents: 10_000,
  itemCount: 1,
  createdAt: new Date("2026-10-20T12:00:00Z"),
});

const board: KanbanColumn[] = [
  { status: "PENDING", total: 2, cards: [card("a", 1), card("b", 2)] },
  { status: "PROCESSING", total: 1, cards: [card("c", 3)] },
  { status: "SHIPPED", total: 0, cards: [] },
  { status: "DELIVERED", total: 0, cards: [] },
  { status: "CANCELLED", total: 0, cards: [] },
];

describe("tablero Kanban", () => {
  it("mueve una tarjeta hasta arriba de otra columna sin modificar el tablero original", () => {
    const moved = moveCard(board, "b", "PROCESSING");
    expect(moved[0]).toMatchObject({ total: 1, cards: [{ id: "a" }] });
    expect(moved[1].total).toBe(2);
    expect(moved[1].cards.map((item) => item.id)).toEqual(["b", "c"]);
    expect(board[0].cards).toHaveLength(2);
  });

  it("no hace nada si la tarjeta no existe o ya está en esa columna", () => {
    expect(moveCard(board, "a", "PENDING")).toBe(board);
    expect(moveCard(board, "zzz", "SHIPPED")).toBe(board);
  });

  it("sabe cuál es el siguiente paso de cada pedido", () => {
    expect(getNextStatus("PENDING")).toBe("PROCESSING");
    expect(getNextStatus("SHIPPED")).toBe("DELIVERED");
    expect(getNextStatus("DELIVERED")).toBeNull();
    expect(getNextStatus("CANCELLED")).toBeNull();
  });
});

describe("periodos del panel de números", () => {
  it("acepta solo 7, 30 o 90 días", () => {
    expect(parsePeriod("7")).toBe(7);
    expect(parsePeriod(["90"])).toBe(90);
    expect(parsePeriod("abc")).toBe(30);
    expect(parsePeriod(undefined)).toBe(30);
  });

  it("calcula el rango desde la medianoche de la Ciudad de México", () => {
    const range = getPeriodRange(7, new Date("2026-10-24T03:00:00Z")); // 23 oct, 9 p. m. en México
    expect(range.from.toISOString()).toBe("2026-10-17T06:00:00.000Z");
    expect(range.previousFrom.toISOString()).toBe("2026-10-10T06:00:00.000Z");
    expect(range.dayKeys).toHaveLength(7);
    expect(range.dayKeys.at(-1)).toBe("2026-10-23");
  });

  it("completa con ceros los días sin ventas", () => {
    const series = fillDailySeries(["2026-10-22", "2026-10-23"], [{ day: "2026-10-23", revenueCents: 500, orders: 1 }]);
    expect(series).toEqual([
      { day: "2026-10-22", revenueCents: 0, orders: 0 },
      { day: "2026-10-23", revenueCents: 500, orders: 1 },
    ]);
  });

  it("calcula el cambio contra el periodo anterior y no compara contra 0", () => {
    expect(calculateChange(120, 100)).toBeCloseTo(0.2);
    expect(calculateChange(80, 100)).toBeCloseTo(-0.2);
    expect(calculateChange(50, 0)).toBeNull();
  });
});
