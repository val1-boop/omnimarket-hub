import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { chooseStore, db, deleteTestUser, E2E_USER, OTHER_USER, resetData, signIn, type TestUser } from "./helpers";

// Cuentas y tiendas: cada usuario tiene su propia tienda, que empieza vacía, y nunca ve ni modifica
// lo de otra cuenta. La Tienda de demostración (datos de ejemplo) está aparte.

const DEMO_STORE_ID = "tienda-demo";

async function addProduct(page: Page, name: string, price: string, cost: string) {
  await page.goto("/productos/nuevo");
  await page.getByLabel("Nombre del producto").fill(name);
  await page.getByLabel("Categoría").selectOption("Hogar");
  await page.getByLabel("Precio de venta (MXN)").fill(price);
  await page.getByLabel("Lo que te cuesta (MXN)").fill(cost);
  await page.getByLabel("Piezas en inventario").fill("10");
  await page.getByRole("button", { name: "Agregar producto" }).click();
  await expect(page.getByText(`¡Listo! Agregamos “${name}” a tu catálogo.`)).toBeVisible();
}

async function addOrder(page: Page, customer: string, productLabel: string, quantity: string) {
  await page.goto("/pedidos/nuevo");
  await page.getByLabel("¿Para quién es?").selectOption("nuevo");
  await page.getByLabel("Nombre del cliente").fill(customer);
  await page.getByLabel("Ciudad").fill("Cuernavaca");
  await page.getByLabel("Producto 1", { exact: true }).selectOption({ label: productLabel });
  await page.getByLabel("Cantidad del producto 1").fill(quantity);
  await page.getByRole("button", { name: "Crear pedido" }).click();
  const toast = page.getByText(/¡Listo! Creamos el pedido OM-\d{5}\./);
  await expect(toast).toBeVisible();
  await expect(page).toHaveURL(/\/pedidos$/);
  return (await toast.textContent())!.match(/OM-\d{5}/)![0];
}

async function newSession(context: BrowserContext, baseURL: string, user: TestUser) {
  await signIn(context, baseURL, user);
  return context.newPage();
}

const storesOf = (user: TestUser) => db.store.findMany({ where: { ownerId: user.id } });
const statTile = (page: Page, label: string) =>
  page.getByTestId("stat-tile").filter({ has: page.getByText(label, { exact: true }) });

test.describe("Cuentas y tiendas", () => {
  test.beforeEach(async ({ request }) => {
    await resetData(request);
    await deleteTestUser(E2E_USER);
    await deleteTestUser(OTHER_USER);
  });

  test("primer inicio de sesión: tienda propia vacía, sin datos ajenos ni cifras inventadas", async ({ page, context, baseURL }) => {
    await signIn(context, baseURL!);
    await page.goto("/dashboard");

    await expect(page.getByTestId("store-bar")).toContainText("Mi tienda");
    await expect(page.getByRole("heading", { name: /Tu tienda\s*está lista\./ })).toBeVisible();
    await expect(page.getByTestId("empty-store")).toContainText("0 productos registrados");

    // Lo vendido y los pedidos son un cero real; ganancia y ticket no se pueden calcular sin ventas.
    await expect(page.getByTestId("analytics-empty")).toBeVisible();
    await expect(statTile(page, "Vendiste")).toContainText("$0.00");
    await expect(statTile(page, "Pedidos")).toContainText("0");
    await expect(statTile(page, "Te quedó de ganancia")).toContainText("Sin ventas para calcularla");
    await expect(statTile(page, "Ticket promedio")).toContainText("Sin ventas para calcularlo");

    // Ningún dato de la Tienda de demostración (ni de nadie más) aparece en su tienda.
    await page.goto("/productos");
    await expect(page.getByTestId("catalog-empty")).toBeVisible();
    await page.goto("/pedidos");
    await expect(page.getByTestId("orders-empty")).toBeVisible();
    await page.goto("/kanban");
    await expect(page.getByTestId("kanban-empty")).toBeVisible();
    await expect(page.locator("[data-testid^=kanban-card-]")).toHaveCount(0);

    // Se creó exactamente una tienda, vacía, y la de demostración sigue intacta.
    const stores = await storesOf(E2E_USER);
    expect(stores).toHaveLength(1);
    expect(stores[0].isDemo).toBe(false);
    expect(await db.product.count({ where: { storeId: stores[0].id } })).toBe(0);
    expect(await db.order.count({ where: { storeId: DEMO_STORE_ID } })).toBe(300);
  });

  test("inicio de sesión recurrente: no duplica la tienda y conserva sus datos", async ({ page, context, browser, baseURL }) => {
    await signIn(context, baseURL!);
    await addProduct(page, "Vela aromática", "120", "45");

    // Vuelve a entrar desde otro navegador (otra sesión) con la misma cuenta.
    const otherContext = await browser.newContext({ baseURL });
    const again = await newSession(otherContext, baseURL!, E2E_USER);
    for (const path of ["/dashboard", "/productos", "/pedidos", "/kanban"]) await again.goto(path);
    await again.goto("/productos");
    await expect(again.getByTestId("product-card")).toHaveCount(1);
    await expect(again.getByTestId("product-card")).toContainText("Vela aromática");
    await otherContext.close();

    expect(await storesOf(E2E_USER)).toHaveLength(1);
    expect(await db.user.count({ where: { email: E2E_USER.email } })).toBe(1);
  });

  test("aislamiento: cada cuenta ve solo lo suyo y sus métricas no se mezclan", async ({ page, context, browser, baseURL }) => {
    await signIn(context, baseURL!);
    await addProduct(page, "Café de olla", "150", "60");
    const orderNumber = await addOrder(page, "Laura Méndez", "Café de olla · $150.00", "2");

    // Métricas de la cuenta A: solo su pedido (2 × $150 = $300), calculadas con las reglas existentes.
    const [store] = await storesOf(E2E_USER);
    const sold = await db.order.aggregate({
      where: { storeId: store.id, status: { not: "CANCELLED" } },
      _sum: { totalCents: true, costCents: true },
      _count: { _all: true },
    });
    expect(sold).toEqual({ _sum: { totalCents: 30_000, costCents: 12_000 }, _count: { _all: 1 } });
    await page.goto("/dashboard");
    await expect(statTile(page, "Vendiste")).toContainText("$300.00");
    await expect(statTile(page, "Te quedó de ganancia")).toContainText("$180.00");
    await expect(statTile(page, "Te quedó de ganancia")).toContainText("Margen de 60");
    await expect(statTile(page, "Pedidos")).toContainText("1");
    await expect(statTile(page, "Ticket promedio")).toContainText("$300.00");

    // La cuenta B no ve nada de A.
    const otherContext = await browser.newContext({ baseURL });
    const other = await newSession(otherContext, baseURL!, OTHER_USER);
    await other.goto("/productos");
    await expect(other.getByTestId("catalog-empty")).toBeVisible();
    await other.goto("/pedidos");
    await expect(other.getByTestId("orders-empty")).toBeVisible();
    await other.goto("/pedidos?q=" + orderNumber);
    await expect(other.getByTestId("orders-empty")).toBeVisible();
    await other.goto("/dashboard");
    await expect(other.getByTestId("analytics-empty")).toBeVisible();
    await expect(other.getByText("Café de olla")).toHaveCount(0);
    await expect(other.getByText("Laura Méndez")).toHaveCount(0);
    await otherContext.close();

    // Y la Tienda de demostración no cambió por los pedidos de A.
    const demo = await (await page.request.get("/api/test/analytics?page=1&limit=1")).json();
    expect(demo.pagination.total).toBe(300);
  });

  test("persistencia: al cerrar sesión y volver a entrar, todo sigue ahí", async ({ page, context, baseURL }) => {
    await signIn(context, baseURL!);
    await addProduct(page, "Taza de barro", "80", "30");
    const orderNumber = await addOrder(page, "Pedro Ruiz", "Taza de barro · $80.00", "1");

    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/pedidos");
    await expect(page).toHaveURL(/\/login\?callbackUrl=/);

    await signIn(context, baseURL!);
    await page.goto("/pedidos");
    await expect(page.getByTestId(`order-row-${orderNumber}`)).toContainText("Pedro Ruiz");
    await page.goto("/productos");
    await expect(page.getByTestId("product-card")).toContainText("Taza de barro");
    expect(await storesOf(E2E_USER)).toHaveLength(1);
  });

  test("protección: no se puede ver ni modificar lo de otra cuenta, aunque se manipule la petición", async ({ page, context, browser, baseURL }) => {
    // Cuenta A con un producto y un pedido.
    await signIn(context, baseURL!);
    await addProduct(page, "Jabón artesanal", "60", "20");
    const victimNumber = await addOrder(page, "Ana Torres", "Jabón artesanal · $60.00", "1");
    const victim = await db.order.findFirstOrThrow({ where: { number: Number(victimNumber.slice(3)) } });
    const victimProduct = await db.product.findFirstOrThrow({ where: { name: "Jabón artesanal", storeId: victim.storeId } });

    // Cuenta B, con su propio pedido.
    const otherContext = await browser.newContext({ baseURL });
    const attacker = await newSession(otherContext, baseURL!, OTHER_USER);
    await addProduct(attacker, "Producto de B", "10", "5");
    const ownNumber = await addOrder(attacker, "Cliente de B", "Producto de B · $10.00", "1");
    const own = await db.order.findFirstOrThrow({ where: { number: Number(ownNumber.slice(3)) } });

    // 1) Abrir directo la página del producto de A: no existe para B y no muestra su nombre.
    await attacker.goto(`/productos/${victimProduct.id}`);
    await expect(attacker.getByRole("heading", { name: "Este producto ya no existe" })).toBeVisible();
    await expect(attacker.getByText("Jabón artesanal")).toHaveCount(0);

    // 2) El endpoint público no expone pedidos privados (solo lee la Tienda de demostración).
    expect((await attacker.request.get(`/api/test/kanban-status?id=${victim.id}`)).status()).toBe(404);
    expect((await attacker.request.get(`/api/test/kanban-status?order=${victimNumber}`)).status()).toBe(404);

    // 3) Mover el pedido propio, pero cambiando en la petición su id por el del pedido de A.
    await attacker.route("**/kanban", async (route) => {
      const body = route.request().postData();
      if (route.request().method() === "POST" && body?.includes(own.id)) {
        return route.continue({ postData: body.replaceAll(own.id, victim.id) });
      }
      return route.continue();
    });
    await attacker.goto("/kanban");
    await attacker
      .getByTestId(`kanban-card-${ownNumber}`)
      .getByRole("button", { name: /Pasar a Preparándose/ })
      .click();
    await expect(attacker.getByText(/Ese pedido ya no existe en esta tienda\./)).toBeVisible();
    await otherContext.close();

    // El pedido de A no cambió.
    expect((await db.order.findUniqueOrThrow({ where: { id: victim.id } })).status).toBe("PENDING");
  });

  test("la Tienda de demostración está aparte y se puede ir y volver desde la app", async ({ page, context, baseURL }) => {
    await signIn(context, baseURL!);
    await page.goto("/dashboard");
    await expect(page.getByTestId("empty-store")).toBeVisible();

    await page.getByRole("button", { name: "Explorar la tienda de demostración" }).click();
    await expect(page.getByTestId("store-bar")).toContainText("Tienda de demostración");
    await expect(page.getByTestId("store-bar")).toContainText("datos de ejemplo");
    await expect(page.getByRole("heading", { name: /Así va\s*tu tienda\./ })).toBeVisible();

    await page.getByRole("button", { name: "Volver a mi tienda" }).click();
    await expect(page.getByTestId("store-bar")).toContainText("Mi tienda");
    await expect(page.getByTestId("empty-store")).toBeVisible();

    // Al cerrar sesión se olvida la elección: la siguiente vez empieza en su propia tienda.
    await chooseStore(context, baseURL!, "demo");
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/login/);
    const cookies = await context.cookies();
    expect(cookies.find((cookie) => cookie.name === "omnimarket-tienda")).toBeUndefined();
  });
});
