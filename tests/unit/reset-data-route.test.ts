import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Se prueba la ruta sin base de datos: el reinicio y el turno se simulan.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/seed", () => ({ seedDatabase: vi.fn() }));
vi.mock("@/server/reset-cooldown", () => ({ claimResetSlot: vi.fn(), releaseResetSlot: vi.fn() }));

const { POST } = await import("@/app/api/test/reset-data/route");
const { seedDatabase } = await import("@/server/seed");
const { claimResetSlot, releaseResetSlot } = await import("@/server/reset-cooldown");

const post = (headers: Record<string, string> = {}) =>
  POST(new Request("http://localhost/api/test/reset-data", { method: "POST", headers }) as unknown as NextRequest);

describe("POST /api/test/reset-data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(claimResetSlot).mockResolvedValue({ ok: true });
    vi.mocked(releaseResetSlot).mockResolvedValue(undefined);
  });

  it("si el reinicio falla, responde 500 y libera el turno para reintentar sin esperar", async () => {
    vi.mocked(seedDatabase).mockRejectedValue(new Error("se cayó la base"));
    const response = await post();
    expect(response.status).toBe(500);
    expect((await response.json()).error).toContain("No se cambió nada");
    expect(releaseResetSlot).toHaveBeenCalledTimes(1);
  });

  it("si el reinicio sale bien, no libera el turno", async () => {
    vi.mocked(seedDatabase).mockResolvedValue({ products: 24, customers: 40, orders: 300, orderItems: 611 });
    const response = await post();
    expect(response.status).toBe(200);
    expect(releaseResetSlot).not.toHaveBeenCalled();
  });

  it("si hay que esperar, responde 429 sin reiniciar ni liberar nada", async () => {
    vi.mocked(claimResetSlot).mockResolvedValue({ ok: false, retryAfterSeconds: 9 });
    const response = await post();
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("9");
    expect(seedDatabase).not.toHaveBeenCalled();
    expect(releaseResetSlot).not.toHaveBeenCalled();
  });
});
