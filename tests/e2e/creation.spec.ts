import { expect, test } from "@playwright/test";
import { resetData, signIn } from "./helpers";

// Flujo 2: Creación — registrar un pedido y un producto y verlos reflejados.
test.describe("Creación", () => {
  test.beforeEach(async ({ request, context, baseURL }) => {
    await resetData(request);
    await signIn(context, baseURL!);
  });

  test("crear un pedido y verlo hasta arriba de la tabla de pedidos", async ({ page }) => {
    await page.goto("/pedidos/nuevo");

    // Sin datos, el formulario avisa qué falta.
    await page.getByRole("button", { name: "Crear pedido" }).click();
    await expect(page.getByText("Elige a quién le vendes")).toBeVisible();

    await page.getByLabel("¿Para quién es?").selectOption({ label: "Ana García · CDMX" });
    await page.getByLabel("Producto 1", { exact: true }).selectOption({ label: "Gorra Deportiva · $299.00" });
    await page.getByLabel("Cantidad del producto 1").fill("2");
    await page.getByRole("button", { name: "Agregar otro producto" }).click();
    await page.getByLabel("Producto 2", { exact: true }).selectOption({ label: "Tapete de Yoga · $499.00" });
    await expect(page.getByTestId("order-total")).toHaveText("$1,097.00");

    await page.getByRole("button", { name: "Crear pedido" }).click();
    await expect(page.getByText("¡Listo! Creamos el pedido OM-00301.")).toBeVisible();
    await expect(page).toHaveURL(/\/pedidos$/);

    const newRow = page.getByTestId("order-row-OM-00301");
    await expect(newRow).toBeVisible();
    await expect(newRow).toContainText("Ana García");
    await expect(newRow).toContainText("$1,097.00");
    await expect(newRow).toContainText("Por preparar");
    await expect(page.locator("[data-testid^=order-row-]").first()).toHaveAttribute("data-testid", "order-row-OM-00301");
  });

  test("agregar un producto y verlo en el catálogo", async ({ page }) => {
    await page.goto("/productos/nuevo");

    await page.getByLabel("Nombre del producto").fill("Termo de acero 750 ml");
    await page.getByLabel("Categoría").selectOption("Hogar");
    await page.getByLabel("Precio de venta (MXN)").fill("100");
    await page.getByLabel("Lo que te cuesta (MXN)").fill("150");
    await page.getByLabel("Piezas en inventario").fill("12");
    await page.getByRole("button", { name: "Agregar producto" }).click();
    await expect(page.getByText("El costo no puede ser mayor que el precio")).toBeVisible();

    await page.getByLabel("Lo que te cuesta (MXN)").fill("60.50");
    await page.getByRole("button", { name: "Agregar producto" }).click();
    await expect(page.getByText("¡Listo! Agregamos “Termo de acero 750 ml” a tu catálogo.")).toBeVisible();
    await expect(page).toHaveURL(/\/productos$/);

    await page.getByLabel("Buscar productos").fill("termo");
    const card = page.getByTestId("product-card");
    await expect(card).toHaveCount(1);
    await expect(card).toContainText("Termo de acero 750 ml");
    await expect(card).toContainText("$100.00");
    await expect(card).toContainText("Ganas 40%");
  });
});
