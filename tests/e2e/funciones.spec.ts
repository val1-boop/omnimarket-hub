import { expect, test, type Page } from "@playwright/test";
import { chooseStore, db, deleteTestUser, E2E_USER, OTHER_USER, resetData, signIn } from "./helpers";

// Detalle de pedido, inventario que se actualiza con los pedidos y sección de clientes.

/** Prepara "Mi tienda" del usuario de prueba con un producto y un cliente conocidos. */
async function prepareOwnStore(page: Page, stock: number) {
  await page.goto("/dashboard"); // la primera visita crea la tienda propia
  const store = await db.store.findUniqueOrThrow({ where: { ownerId: E2E_USER.id } });
  const product = await db.product.create({
    data: { storeId: store.id, sku: "OM-HOG-001", name: "Vela de soya", category: "Hogar", priceCents: 15000, costCents: 6000, stock },
  });
  const customer = await db.customer.create({ data: { storeId: store.id, name: "Laura Méndez", city: "Cuernavaca" } });
  return { store, product, customer };
}

async function createOrder(page: Page, quantity: number) {
  await page.goto("/pedidos/nuevo");
  await page.getByLabel("¿Para quién es?").selectOption({ label: "Laura Méndez · Cuernavaca" });
  await page.getByLabel("Producto 1", { exact: true }).selectOption({ label: "Vela de soya · $150.00" });
  await page.getByLabel("Cantidad del producto 1").fill(String(quantity));
  await page.getByRole("button", { name: "Crear pedido" }).click();
}

const stockOf = async (id: string) => (await db.product.findUniqueOrThrow({ where: { id } })).stock;

async function changeStatus(page: Page, label: string) {
  await page.getByLabel("Paso del pedido").selectOption({ label });
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText(new RegExp(`ahora está en “${label}”`))).toBeVisible();
}

test.describe("Funciones de la tienda", () => {
  test.beforeEach(async ({ request, context, baseURL }) => {
    await resetData(request);
    await deleteTestUser(E2E_USER);
    await deleteTestUser(OTHER_USER);
    await signIn(context, baseURL!);
  });

  test("el detalle de un pedido muestra productos, cantidades, precios y total", async ({ page, context, baseURL }) => {
    await chooseStore(context, baseURL!, "demo");
    const order = await db.order.findFirstOrThrow({
      where: { storeId: "tienda-demo" },
      orderBy: { number: "desc" },
      include: { items: { include: { product: true } }, customer: true },
    });
    const number = `OM-${String(order.number).padStart(5, "0")}`;

    await page.goto("/pedidos");
    await page.getByRole("link", { name: `Ver el detalle del pedido ${number}` }).click();
    await expect(page).toHaveURL(`/pedidos/${order.id}`);
    await expect(page.getByRole("heading", { name: number })).toBeVisible();
    await expect(page.getByTestId("order-line")).toHaveCount(order.items.length);
    for (const item of order.items) {
      const line = page.getByTestId("order-line").filter({ hasText: item.product.name });
      const unit = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(item.unitPriceCents / 100);
      await expect(line).toContainText(`${item.quantity} × ${unit}`);
    }
    const total = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(order.totalCents / 100);
    await expect(page.getByTestId("order-detail-total")).toHaveText(total);
    await expect(page.getByRole("link", { name: order.customer.name })).toBeVisible();

    // También se llega desde el tablero, tocando el número del pedido.
    await page.goto("/kanban");
    const card = await db.order.findFirstOrThrow({ where: { storeId: "tienda-demo", status: "PENDING" }, orderBy: { position: "asc" } });
    const cardNumber = `OM-${String(card.number).padStart(5, "0")}`;
    await page.getByRole("link", { name: `Ver el detalle del pedido ${cardNumber}` }).click();
    await expect(page.getByRole("heading", { name: cardNumber })).toBeVisible();
  });

  test("el inventario baja al vender, regresa al cancelar y avisa si no alcanza", async ({ page }) => {
    const { product } = await prepareOwnStore(page, 5);

    // Vender 3 de 5: quedan 2 y aparece en "Se están acabando".
    await createOrder(page, 3);
    await expect(page.getByText(/¡Listo! Creamos el pedido OM-\d{5}\./)).toBeVisible();
    expect(await stockOf(product.id)).toBe(2);
    await page.goto("/dashboard");
    await expect(page.getByTestId("low-stock")).toContainText("Vela de soya");
    await expect(page.getByTestId("low-stock")).toContainText("Quedan 2");

    // Pedir más de lo que hay: no se guarda nada y se explica por qué.
    await createOrder(page, 3);
    await expect(page.getByTestId("stock-hint")).toHaveText("Solo quedan 2 piezas");
    await expect(page.getByText("Solo quedan 2 piezas de “Vela de soya”.")).toBeVisible();
    expect(await stockOf(product.id)).toBe(2);
    expect(await db.order.count({ where: { items: { some: { productId: product.id } } } })).toBe(1);

    // Cancelar regresa las piezas; reactivar las vuelve a apartar.
    const order = await db.order.findFirstOrThrow({ where: { items: { some: { productId: product.id } } } });
    await page.goto(`/pedidos/${order.id}`);
    await changeStatus(page, "Cancelado");
    expect(await stockOf(product.id)).toBe(5);
    await changeStatus(page, "Por preparar");
    expect(await stockOf(product.id)).toBe(2);

    // Moverlo entre pasos normales no cambia el inventario.
    await changeStatus(page, "En camino");
    expect(await stockOf(product.id)).toBe(2);

    // Borrar un pedido que no estaba cancelado también regresa sus piezas.
    await page.goto("/pedidos");
    const number = `OM-${String(order.number).padStart(5, "0")}`;
    await page.getByLabel(`Seleccionar el pedido ${number}`).check();
    await page.getByRole("button", { name: "Borrar", exact: true }).click();
    await page.getByRole("button", { name: "Sí, borrar" }).click();
    await expect.poll(() => stockOf(product.id)).toBe(5);

    // Agotado: ya no se puede elegir en un pedido nuevo.
    await db.product.update({ where: { id: product.id }, data: { stock: 0 } });
    await page.goto("/pedidos/nuevo");
    await expect(page.getByRole("option", { name: "Vela de soya · $150.00 · agotado" })).toBeDisabled();
    await page.goto("/productos");
    await expect(page.getByTestId("product-card").getByTestId("stock-badge")).toHaveText("Agotado");
  });

  test("clientes: lista con lo que han comprado, historial, edición y borrado", async ({ page }) => {
    const { customer } = await prepareOwnStore(page, 10);
    await createOrder(page, 2);
    await expect(page.getByText(/¡Listo! Creamos el pedido OM-\d{5}\./)).toBeVisible();

    await page.goto("/clientes");
    const row = page.getByTestId("customer-row").filter({ hasText: "Laura Méndez" });
    await expect(row).toContainText("$300.00");
    await expect(row).toContainText("1 pedido");

    // Historial y edición.
    await row.click();
    await expect(page).toHaveURL(`/clientes/${customer.id}`);
    await expect(page.getByTestId("customer-orders").getByRole("link")).toHaveCount(1);
    await expect(page.getByTestId("customer-stats")).toContainText("$300.00");
    await page.getByLabel("Ciudad").fill("Jiutepec");
    await page.getByLabel("Correo (opcional)").fill("laura@correo.mx");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Guardamos los cambios de Laura Méndez.")).toBeVisible();
    expect(await db.customer.findUniqueOrThrow({ where: { id: customer.id } })).toMatchObject({ city: "Jiutepec", email: "laura@correo.mx" });
    // Con pedidos no se puede borrar (para no perder el historial).
    await expect(page.getByText("Tiene pedidos, por eso no se puede borrar.")).toBeVisible();

    // Cliente nuevo: el correo no se puede repetir dentro de la tienda.
    await page.goto("/clientes/nuevo");
    await page.getByLabel("Nombre").fill("Pedro Ruiz");
    await page.getByLabel("Ciudad").fill("Cuautla");
    await page.getByLabel("Correo (opcional)").fill("LAURA@correo.mx");
    await page.getByRole("button", { name: "Agregar cliente" }).click();
    await expect(page.getByText("Ya tienes un cliente con ese correo.")).toBeVisible();
    await page.getByLabel("Correo (opcional)").fill("");
    await page.getByRole("button", { name: "Agregar cliente" }).click();
    await expect(page.getByText("¡Listo! Agregamos a Pedro Ruiz.")).toBeVisible();

    // Sin pedidos sí se puede borrar.
    await page.getByTestId("customer-row").filter({ hasText: "Pedro Ruiz" }).click();
    await page.getByRole("button", { name: "Borrar cliente" }).click();
    await page.getByRole("button", { name: "Sí, borrar" }).click();
    await expect(page.getByText("Quitamos a Pedro Ruiz de tus clientes.")).toBeVisible();
    await expect(page.getByTestId("customer-row")).toHaveCount(1);
  });

  test("la lista de clientes de la demostración se busca y se pagina", async ({ page, context, baseURL }) => {
    await chooseStore(context, baseURL!, "demo");
    await page.goto("/clientes");
    await expect(page.getByTestId("customer-row")).toHaveCount(20);
    await expect(page.getByText("Página 1 de 2 · 40 en total")).toBeVisible();
    await page.getByLabel("Buscar clientes").fill("Ana García");
    await page.getByRole("button", { name: "Buscar" }).click();
    await expect(page.getByTestId("customer-row")).toHaveCount(1);
    await page.getByLabel("Buscar clientes").fill("no-existe-nadie");
    await page.getByRole("button", { name: "Buscar" }).click();
    await expect(page.getByTestId("customers-empty")).toContainText("No encontramos a nadie así");
  });

  test("nadie puede abrir pedidos ni clientes de otra tienda", async ({ page, browser, baseURL }) => {
    const { customer } = await prepareOwnStore(page, 10);
    await createOrder(page, 1);
    await expect(page.getByText(/¡Listo! Creamos el pedido OM-\d{5}\./)).toBeVisible();
    const order = await db.order.findFirstOrThrow({ where: { customerId: customer.id } });

    const other = await browser.newContext();
    await signIn(other, baseURL!, OTHER_USER);
    const otherPage = await other.newPage();
    await otherPage.goto(`/pedidos/${order.id}`);
    await expect(otherPage.getByRole("heading", { name: "Este pedido no existe" })).toBeVisible();
    await otherPage.goto(`/clientes/${customer.id}`);
    await expect(otherPage.getByRole("heading", { name: "Este cliente no existe" })).toBeVisible();
    await otherPage.goto("/clientes");
    await expect(otherPage.getByTestId("customers-empty")).toContainText("Todavía no tienes clientes");
    await other.close();
  });
});
