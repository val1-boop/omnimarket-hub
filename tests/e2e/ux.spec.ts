import { expect, test } from "@playwright/test";
import { chooseStore, deleteTestUser, OTHER_USER, resetData, signIn } from "./helpers";

// Detalles de experiencia: páginas "no encontrado", formularios que llegan llenos y campos con nombre.
test.describe("Experiencia de uso", () => {
  test.beforeEach(async ({ request, context, baseURL }) => {
    await resetData(request);
    await signIn(context, baseURL!);
    // Estas pruebas necesitan datos: trabajan en la Tienda de demostración.
    await chooseStore(context, baseURL!, "demo");
  });

  test("un producto que no existe muestra un aviso en español con flecha para regresar", async ({ page }) => {
    await page.goto("/productos/ya-no-existe");
    await expect(page.getByRole("heading", { name: "Este producto ya no existe" })).toBeVisible();
    await page.getByRole("link", { name: "Volver a productos" }).click();
    await expect(page).toHaveURL(/\/productos$/);
  });

  test("una dirección que no existe responde 404 con un aviso en español", async ({ page }) => {
    const response = await page.goto("/esta-pagina-no-existe");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Esta página no existe" })).toBeVisible();
    await page.getByRole("link", { name: "Volver al inicio" }).first().click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("el formulario de edición llega ya lleno desde el servidor", async ({ page }) => {
    // Se revisa el HTML que manda el servidor, antes de que cargue el JavaScript.
    const html = await (await page.request.get("/productos/prod_011")).text();
    expect(html).toMatch(/<input[^>]*id="name"[^>]*value="Gorra Deportiva"/);
    expect(html).toMatch(/<input[^>]*id="price"[^>]*value="299"/);
    expect(html).toMatch(/<input[^>]*id="stock"[^>]*value="150"/);
  });

  test("todos los campos de la tabla de pedidos tienen id o name", async ({ page }) => {
    await page.goto("/pedidos");
    await expect(page.getByTestId("orders-table")).toBeVisible();
    const unnamed = await page.$$eval(
      "input, select, textarea",
      (fields) => (fields as HTMLInputElement[]).filter((field) => !field.id && !field.name).length,
    );
    expect(unnamed).toBe(0);
  });

  test("en celular, el Inicio de una tienda nueva cabe en la pantalla", async ({ page, context, baseURL }) => {
    await deleteTestUser(OTHER_USER);
    await signIn(context, baseURL!, OTHER_USER);
    await chooseStore(context, baseURL!, "mia");

    for (const width of [320, 360, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/dashboard");
      await expect(page.getByTestId("empty-store")).toBeVisible();
      // Nada empuja la página más ancha que la pantalla, y los números del recorrido se ven completos.
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth, `ancho ${width}px`).toBeLessThanOrEqual(clientWidth);
      for (const name of ["Agregar mi primer producto", "Explorar la tienda de demostración"]) {
        const box = (await page.getByRole(name.startsWith("Agregar") ? "link" : "button", { name }).boundingBox())!;
        expect(box.x + box.width, `${name} a ${width}px`).toBeLessThanOrEqual(width);
      }
      const count = (await page.getByText("Por preparar", { exact: true }).locator("..").boundingBox())!;
      expect(count.x + count.width, `recorrido a ${width}px`).toBeLessThanOrEqual(width);
    }
  });

  test("el botón de modo oscuro cambia los colores y se recuerda al volver", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/dashboard");
    const html = page.locator("html");
    const pageBackground = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await expect(html).toHaveAttribute("data-theme", "light");
    const light = await pageBackground();

    await page.getByRole("button", { name: "Cambiar a modo oscuro" }).click();
    await expect(html).toHaveAttribute("data-theme", "dark");
    expect(await pageBackground()).not.toBe(light);

    // Al recargar y en otra página sigue en oscuro, y se puede regresar a claro.
    await page.goto("/clientes");
    await expect(html).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "Cambiar a modo claro" }).click();
    await expect(html).toHaveAttribute("data-theme", "light");
    expect(await pageBackground()).toBe(light);
  });

  test("si nunca eligió, usa el modo de su celular o computadora", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/login");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});
