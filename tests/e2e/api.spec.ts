import { expect, test } from "@playwright/test";
import { resetData } from "./helpers";

// Endpoints de auditoría: protecciones de reset-data y que el ticket promedio cuadre con los pedidos.
test.describe("API de prueba", () => {
  test.beforeEach(async ({ request }) => {
    await resetData(request);
  });

  test("reset-data no se puede usar desde otra página web ni con GET", async ({ request }) => {
    const before = await (await request.get("/api/test/analytics?page=1&limit=1")).json();

    const crossSite = await request.post("/api/test/reset-data", { headers: { Origin: "https://sitio-ajeno.example" } });
    expect(crossSite.status()).toBe(403);
    expect((await crossSite.json()).error).toContain("otra página web");

    const withGet = await request.get("/api/test/reset-data");
    expect(withGet.status()).toBe(405);

    // Nada cambió.
    const after = await (await request.get("/api/test/analytics?page=1&limit=1")).json();
    expect(after.summary).toEqual(before.summary);
  });

  test("el ticket promedio del resumen es el promedio de los pedidos vendidos", async ({ request }) => {
    const first = await (await request.get("/api/test/analytics?page=1&limit=100")).json();
    const orders = [...first.data];
    for (let page = 2; page <= first.pagination.totalPages; page++) {
      orders.push(...(await (await request.get(`/api/test/analytics?page=${page}&limit=100`)).json()).data);
    }
    expect(orders).toHaveLength(first.pagination.total);

    // Se calcula aquí, pedido por pedido, sin usar el código de la app.
    const sold = orders.filter((order) => order.status !== "CANCELLED");
    const revenue = sold.reduce((sum, order) => sum + order.totalCents, 0);
    expect(first.summary.soldOrders).toBe(sold.length);
    expect(first.summary.revenueCents).toBe(revenue);
    expect(first.summary.averageTicketCents).toBe(Math.round(revenue / sold.length));
  });
});
