import { expect, test, type Page } from "@playwright/test";
import { chooseStore, db, resetData, signIn } from "./helpers";

// Edición en lote: cambiar varios pedidos a la vez, con aviso, persistencia y "todo o nada" si falla.

const DEMO = "tienda-demo";
const orderNumber = (number: number) => `OM-${String(number).padStart(5, "0")}`;

async function selectRows(page: Page, numbers: number[]) {
  for (const number of numbers) await page.getByLabel(`Seleccionar el pedido ${orderNumber(number)}`).check();
  await expect(page.getByRole("region", { name: "Acciones para los pedidos seleccionados" })).toContainText(
    `${numbers.length} pedidos seleccionados`,
  );
}

test.describe("Edición en lote", () => {
  test.beforeEach(async ({ request, context, baseURL }) => {
    await resetData(request);
    await signIn(context, baseURL!);
    await chooseStore(context, baseURL!, "demo");
  });

  test("cambia varios pedidos de paso a la vez: se ve al instante, avisa y queda guardado", async ({ page, request }) => {
    const pending = await db.order.findMany({ where: { storeId: DEMO, status: "PENDING" }, orderBy: { number: "desc" }, take: 3 });
    const numbers = pending.map((order) => order.number);

    await page.goto("/pedidos?status=PENDING");
    await page.waitForLoadState("networkidle");
    await selectRows(page, numbers);
    await page.getByLabel("Pasar a").selectOption({ label: "En camino" });
    await page.getByRole("button", { name: "Aplicar" }).click();

    await expect(page.getByText("¡Listo! 3 pedidos quedaron en “En camino”.")).toBeVisible();
    // Los tres quedaron guardados (la base y el endpoint de auditoría coinciden)...
    const saved = await db.order.findMany({ where: { id: { in: pending.map((order) => order.id) } } });
    expect(saved.map((order) => order.status)).toEqual(["SHIPPED", "SHIPPED", "SHIPPED"]);
    for (const number of numbers) {
      const status = await (await request.get(`/api/test/kanban-status?order=${orderNumber(number)}`)).json();
      expect(status.order.status).toBe("SHIPPED");
    }
    // ...y siguen así al recargar.
    await page.goto("/pedidos?status=SHIPPED");
    for (const number of numbers) await expect(page.getByTestId(`order-row-${orderNumber(number)}`)).toContainText("En camino");
  });

  test("si falla, no cambia ninguno: los pedidos regresan como estaban y se avisa", async ({ page }) => {
    const pending = await db.order.findMany({ where: { storeId: DEMO, status: "PENDING" }, orderBy: { number: "desc" }, take: 2 });
    await page.route("**/pedidos*", async (route) => {
      if (route.request().method() === "POST") await route.abort("failed");
      else await route.continue();
    });
    await page.goto("/pedidos?status=PENDING");
    await page.waitForLoadState("networkidle");
    await selectRows(page, pending.map((order) => order.number));
    await page.getByLabel("Pasar a").selectOption({ label: "Entregado" });
    await page.getByRole("button", { name: "Aplicar" }).click();

    await expect(page.getByText(/Regresamos los pedidos como estaban\./)).toBeVisible();
    for (const order of pending) await expect(page.getByTestId(`order-row-${orderNumber(order.number)}`)).toContainText("Por preparar");
    const saved = await db.order.findMany({ where: { id: { in: pending.map((order) => order.id) } } });
    expect(saved.every((order) => order.status === "PENDING")).toBe(true);
  });

  test("borrar varios pide confirmación; si dices “Mejor no” no se borra nada", async ({ page }) => {
    const pending = await db.order.findMany({ where: { storeId: DEMO, status: "PENDING" }, orderBy: { number: "desc" }, take: 2 });
    await page.goto("/pedidos?status=PENDING");
    await page.waitForLoadState("networkidle");
    await selectRows(page, pending.map((order) => order.number));

    await page.getByRole("button", { name: "Borrar", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("¿Borrar 2 pedidos?");
    await page.getByRole("button", { name: "Mejor no" }).click();
    expect(await db.order.count({ where: { id: { in: pending.map((order) => order.id) } } })).toBe(2);

    await page.getByRole("button", { name: "Borrar", exact: true }).click();
    await page.getByRole("button", { name: "Sí, borrar" }).click();
    await expect(page.getByText("Borramos 2 pedidos.")).toBeVisible();
    await expect.poll(() => db.order.count({ where: { id: { in: pending.map((order) => order.id) } } })).toBe(0);
  });
});
