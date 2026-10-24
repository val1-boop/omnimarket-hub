import { expect, test } from "@playwright/test";
import { resetData, signIn } from "./helpers";

// Detalles de experiencia: páginas "no encontrado", formularios que llegan llenos y campos con nombre.
test.describe("Experiencia de uso", () => {
  test.beforeEach(async ({ request, context, baseURL }) => {
    await resetData(request);
    await signIn(context, baseURL!);
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
});
