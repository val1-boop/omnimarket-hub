import { expect, test } from "@playwright/test";
import { chooseStore, db, deleteTestUser, OTHER_USER, resetData, signIn } from "./helpers";

// Números de cada producto, comprobante para imprimir y tablas que se pueden ordenar.

const DEMO = "tienda-demo";
const money = (cents: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(cents / 100);
const orderNumber = (number: number) => `OM-${String(number).padStart(5, "0")}`;

test.describe("Detalles de la tienda", () => {
  test.beforeEach(async ({ request, context, baseURL }) => {
    await resetData(request);
    await signIn(context, baseURL!);
    await chooseStore(context, baseURL!, "demo");
  });

  test("la página de un producto muestra cuánto se ha vendido, igual que en la base", async ({ page }) => {
    // Lo vendido de la Gorra Deportiva, calculado aquí pedido por pedido (sin cancelados).
    const items = await db.orderItem.findMany({
      where: { productId: "prod_011", order: { storeId: DEMO, status: { not: "CANCELLED" } } },
      include: { order: true },
    });
    const pieces = items.reduce((sum, item) => sum + item.quantity, 0);
    const revenue = items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
    const profit = items.reduce((sum, item) => sum + item.quantity * (item.unitPriceCents - item.unitCostCents), 0);

    await page.goto("/productos/prod_011");
    await expect(page.getByRole("heading", { name: "Gorra Deportiva" })).toBeVisible();
    const stats = page.getByTestId("product-stats");
    await expect(stats).toContainText(`Piezas vendidas${pieces}`);
    await expect(stats).toContainText(money(revenue));
    await expect(stats).toContainText(money(profit));
    // Sus pedidos más recientes, con liga al detalle.
    const recent = await db.orderItem.findFirstOrThrow({
      where: { productId: "prod_011", order: { storeId: DEMO } },
      orderBy: [{ order: { createdAt: "desc" } }, { order: { number: "desc" } }],
      include: { order: true },
    });
    const list = page.getByTestId("product-orders");
    // Cada pedido aparece una sola vez, aunque traiga el producto en dos líneas.
    const numbers = await list.getByRole("link").allTextContents();
    const shown = numbers.map((text) => text.match(/OM-\d{5}/)![0]);
    expect(new Set(shown).size).toBe(shown.length);
    await expect(list.getByRole("link").first()).toContainText(orderNumber(recent.order.number));
    await list.getByRole("link").first().click();
    await expect(page).toHaveURL(`/pedidos/${recent.order.id}`);
  });

  test("el comprobante del pedido sale listo para imprimir, con sus productos y total", async ({ page, browser, baseURL }) => {
    const order = await db.order.findFirstOrThrow({
      where: { storeId: DEMO },
      orderBy: { number: "desc" },
      include: { items: { include: { product: true } }, customer: true },
    });
    await page.goto(`/pedidos/${order.id}`);
    await page.getByRole("link", { name: "Comprobante" }).click();
    await expect(page).toHaveURL(`/comprobante/${order.id}`);

    const receipt = page.getByTestId("receipt");
    await expect(receipt).toContainText("Comprobante de pedido");
    await expect(receipt).toContainText(orderNumber(order.number));
    await expect(receipt).toContainText(order.customer.name);
    await expect(page.getByTestId("receipt-lines").locator("tbody tr")).toHaveCount(order.items.length);
    for (const item of order.items) await expect(receipt).toContainText(item.product.name);
    await expect(page.getByTestId("receipt-total")).toHaveText(money(order.totalCents));
    // No es una factura: se dice claramente. Y no muestra costos ni ganancias.
    await expect(receipt).toContainText("no es una factura ni un comprobante fiscal (CFDI)");
    await expect(receipt).not.toContainText("Ganancia");
    await expect(page.getByRole("button", { name: "Imprimir o guardar PDF" })).toBeVisible();

    // Al imprimir no salen los botones.
    await page.emulateMedia({ media: "print" });
    await expect(page.getByRole("button", { name: "Imprimir o guardar PDF" })).toBeHidden();
    await expect(receipt).toBeVisible();

    // Otra cuenta en su propia tienda no lo puede abrir.
    await deleteTestUser(OTHER_USER);
    const other = await browser.newContext();
    await signIn(other, baseURL!, OTHER_USER);
    const otherPage = await other.newPage();
    await otherPage.goto(`/comprobante/${order.id}`);
    await expect(otherPage.getByRole("heading", { name: "Este pedido no existe" })).toBeVisible();
    await other.close();
  });

  test("la tabla de pedidos se ordena por total, fecha o cliente", async ({ page }) => {
    const highest = await db.order.findFirstOrThrow({ where: { storeId: DEMO }, orderBy: [{ totalCents: "desc" }, { number: "desc" }] });
    const lowest = await db.order.findFirstOrThrow({ where: { storeId: DEMO }, orderBy: [{ totalCents: "asc" }, { number: "asc" }] });
    const oldest = await db.order.findFirstOrThrow({ where: { storeId: DEMO }, orderBy: [{ createdAt: "asc" }, { number: "asc" }] });
    const firstRow = () => page.getByTestId("orders-table").locator("tbody tr").first();

    await page.goto("/pedidos");
    // Tocar "Total": primero el más alto; otra vez: el más bajo.
    await page.getByRole("link", { name: /^Total/ }).click();
    await expect(page).toHaveURL(/orden=mayor/);
    await expect(firstRow()).toHaveAttribute("data-testid", `order-row-${orderNumber(highest.number)}`);
    await expect(page.getByRole("columnheader", { name: /Total/ })).toHaveAttribute("aria-sort", "descending");
    await page.getByRole("link", { name: /^Total/ }).click();
    await expect(page).toHaveURL(/orden=menor/);
    await expect(firstRow()).toHaveAttribute("data-testid", `order-row-${orderNumber(lowest.number)}`);

    // El selector hace lo mismo (es el que se usa en celular), y el orden se conserva al buscar.
    await page.getByLabel("Ordenar por").selectOption({ label: "Más antiguos" });
    await expect(page).toHaveURL(/orden=antiguos/);
    await expect(firstRow()).toHaveAttribute("data-testid", `order-row-${orderNumber(oldest.number)}`);
    await page.getByLabel("Buscar pedidos").fill(oldest.number.toString());
    await page.getByRole("button", { name: "Buscar" }).click();
    await expect(page).toHaveURL(/orden=antiguos/);

    // Un orden que no existe en la dirección se ignora (orden de siempre).
    await page.goto("/pedidos?orden=hackeo");
    await expect(page.getByLabel("Ordenar por")).toHaveValue("recientes");
  });

  test("la lista de clientes se ordena por compras, compra reciente o nombre", async ({ page }) => {
    const byName = await db.customer.findFirstOrThrow({ where: { storeId: DEMO }, orderBy: [{ name: "asc" }, { id: "asc" }] });
    await page.goto("/clientes");
    await page.getByLabel("Ordenar por").selectOption({ label: "Nombre (A–Z)" });
    await expect(page).toHaveURL(/orden=nombre/);
    await expect(page.getByTestId("customer-row").first()).toContainText(byName.name);
    // La paginación conserva el orden.
    await expect(page.getByRole("link", { name: /Siguiente/ })).toHaveAttribute("href", /orden=nombre/);
  });
});
