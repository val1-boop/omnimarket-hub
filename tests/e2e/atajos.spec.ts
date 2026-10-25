import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { chooseStore, db, deleteTestUser, E2E_USER, OTHER_USER, resetData, signIn } from "./helpers";

// Descargar pedidos en Excel, nuevo pedido desde el cliente, búsqueda mientras escribes
// y el aviso de la tienda de demostración en celular.

const DEMO = "tienda-demo";
const orderNumber = (number: number) => `OM-${String(number).padStart(5, "0")}`;

test.describe("Atajos y comodidades", () => {
  test.beforeEach(async ({ request, context, baseURL }) => {
    await resetData(request);
    await deleteTestUser(E2E_USER);
    await deleteTestUser(OTHER_USER);
    await signIn(context, baseURL!);
  });

  test("descargar pedidos en Excel: con los mismos filtros y orden que la tabla", async ({ page, context, baseURL, browser }) => {
    await chooseStore(context, baseURL!, "demo");
    const cancelled = await db.order.findMany({
      where: { storeId: DEMO, status: "CANCELLED" },
      orderBy: [{ totalCents: "desc" }, { number: "desc" }],
      include: { customer: true },
    });

    await page.goto("/pedidos?status=CANCELLED&orden=mayor");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Descargar Excel" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^pedidos-demostracion-\d{4}-\d{2}-\d{2}\.csv$/);
    const csv = await readFile((await download.path())!, "utf8");
    expect(csv.startsWith("﻿")).toBe(true);
    const lines = csv.replace(/^﻿/, "").trimEnd().split("\r\n");
    expect(lines[0]).toBe("Pedido,Fecha,Hora,Cliente,Ciudad,Correo,Paso,Productos,Piezas,Total (MXN),Costo (MXN),Ganancia (MXN)");
    // Todos los cancelados (no solo una página), del total más alto al más bajo.
    expect(lines).toHaveLength(cancelled.length + 1);
    expect(lines[1]).toContain(orderNumber(cancelled[0].number));
    expect(lines[1]).toContain(cancelled[0].customer.name);
    expect(lines[1]).toContain((cancelled[0].totalCents / 100).toFixed(2));
    expect(lines.slice(1).every((line) => line.includes(",Cancelado,"))).toBe(true);

    // Otra cuenta descarga solo lo suyo (su tienda está vacía); sin sesión no se descarga nada.
    const other = await browser.newContext();
    await signIn(other, baseURL!, OTHER_USER);
    const otherCsv = await (await other.request.get(`${baseURL}/api/pedidos/exportar`)).text();
    expect(otherCsv.replace(/^﻿/, "").trimEnd().split("\r\n")).toHaveLength(1);
    await other.close();
    const anonymous = await browser.newContext();
    expect((await anonymous.request.get(`${baseURL}/api/pedidos/exportar`)).status()).toBe(401);
    await anonymous.close();
  });

  test("nuevo pedido desde la ficha del cliente: ya viene elegido", async ({ page }) => {
    await page.goto("/dashboard"); // crea "Mi tienda"
    const store = await db.store.findUniqueOrThrow({ where: { ownerId: E2E_USER.id } });
    await db.product.create({
      data: { storeId: store.id, sku: "OM-HOG-001", name: "Vela de soya", category: "Hogar", priceCents: 15000, costCents: 6000, stock: 10 },
    });
    const customer = await db.customer.create({ data: { storeId: store.id, name: "Laura Méndez", city: "Cuernavaca" } });

    await page.goto(`/clientes/${customer.id}`);
    await page.getByRole("link", { name: "Nuevo pedido para este cliente" }).click();
    await expect(page).toHaveURL(`/pedidos/nuevo?cliente=${customer.id}`);
    await expect(page.getByLabel("¿Para quién es?")).toHaveValue(customer.id);
    await page.getByLabel("Producto 1", { exact: true }).selectOption({ label: "Vela de soya · $150.00" });
    await page.getByRole("button", { name: "Crear pedido" }).click();
    await expect(page.getByText(/¡Listo! Creamos el pedido OM-\d{5}\./)).toBeVisible();
    expect(await db.order.count({ where: { customerId: customer.id } })).toBe(1);

    // Un cliente de otra tienda en la dirección no se elige.
    const demoCustomer = await db.customer.findFirstOrThrow({ where: { storeId: DEMO } });
    await page.goto(`/pedidos/nuevo?cliente=${demoCustomer.id}`);
    await expect(page.getByLabel("¿Para quién es?")).toHaveValue("");
  });

  test("buscar mientras escribes en pedidos y clientes, sin perder el lugar", async ({ page, context, baseURL }) => {
    await chooseStore(context, baseURL!, "demo");
    await page.goto("/pedidos?status=DELIVERED");
    await page.waitForLoadState("networkidle");
    const search = page.getByLabel("Buscar pedidos");
    await search.pressSequentially("Ana", { delay: 60 });
    // Sin tocar "Buscar": la dirección cambia sola y se conserva el paso elegido.
    await expect(page).toHaveURL(/q=Ana/);
    await expect(page).toHaveURL(/status=DELIVERED/);
    await expect(search).toBeFocused();
    const rows = page.getByTestId("orders-table").locator("tbody tr");
    await expect(rows.first()).toContainText("Ana");
    for (const text of await rows.allTextContents()) expect(text).toContain("Ana");
    // "Limpiar" quita la búsqueda.
    await page.getByRole("button", { name: "Limpiar" }).click();
    await expect(page).not.toHaveURL(/q=/);
    await expect(search).toHaveValue("");

    await page.goto("/clientes");
    await page.waitForLoadState("networkidle");
    const customers = page.getByLabel("Buscar clientes");
    await customers.pressSequentially("Ana García", { delay: 40 });
    await expect(page).toHaveURL(/q=Ana(\+|%20)Garc/);
    await expect(page.getByTestId("customer-row")).toHaveCount(1);
    await expect(customers).toBeFocused();
  });

  test("en celular, el aviso de la tienda de demostración ocupa una sola franja delgada", async ({ page, context, baseURL }) => {
    await chooseStore(context, baseURL!, "demo");
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/dashboard");
      const bar = page.getByTestId("store-bar");
      await expect(bar).toContainText("Tienda de demostración");
      await expect(bar.getByRole("button", { name: "Volver a mi tienda" })).toBeVisible();
      // Antes medía unos 150 px de alto en celular; ahora cabe en una franja de máximo 64 px.
      expect((await bar.boundingBox())!.height, `alto a ${width}px`).toBeLessThanOrEqual(64);
    }
  });
});
