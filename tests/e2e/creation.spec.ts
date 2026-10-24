import { expect, test } from "@playwright/test";
import { deleteTestUser, E2E_USER, signIn } from "./helpers";

// Flujo 2: Creación — registrar un producto y un pedido en la tienda propia y verlos en la tabla.
// Cada prueba empieza con una cuenta nueva (tienda vacía), como un usuario que entra por primera vez.
test.describe("Creación", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await deleteTestUser(E2E_USER);
    await signIn(context, baseURL!);
  });

  test("agregar un producto y verlo en el catálogo", async ({ page }) => {
    await page.goto("/productos");
    await expect(page.getByTestId("catalog-empty")).toBeVisible();
    await page.getByRole("link", { name: "Agregar mi primer producto" }).click();

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

    const card = page.getByTestId("product-card");
    await expect(card).toHaveCount(1);
    await expect(card).toContainText("Termo de acero 750 ml");
    await expect(card).toContainText("$100.00");
    await expect(card).toContainText("Ganas 40%");

    // Sigue ahí después de recargar.
    await page.reload();
    await expect(page.getByTestId("product-card")).toContainText("Termo de acero 750 ml");
  });

  test("crear un pedido con un cliente nuevo y verlo hasta arriba de la tabla de pedidos", async ({ page }) => {
    // Primero un producto (un pedido necesita al menos uno).
    await page.goto("/pedidos/nuevo");
    await expect(page.getByTestId("order-needs-products")).toBeVisible();
    await page.getByRole("link", { name: "Agregar mi primer producto" }).click();
    await page.getByLabel("Nombre del producto").fill("Gorra bordada");
    await page.getByLabel("Categoría").selectOption("Ropa");
    await page.getByLabel("Precio de venta (MXN)").fill("299");
    await page.getByLabel("Lo que te cuesta (MXN)").fill("90");
    await page.getByLabel("Piezas en inventario").fill("20");
    await page.getByRole("button", { name: "Agregar producto" }).click();
    await expect(page.getByText("¡Listo! Agregamos “Gorra bordada” a tu catálogo.")).toBeVisible();

    await page.goto("/pedidos/nuevo");
    // La tienda no tiene clientes: el formulario empieza en "Cliente nuevo".
    await expect(page.getByLabel("¿Para quién es?")).toHaveValue("nuevo");

    // Sin datos, el formulario avisa qué falta.
    await page.getByRole("button", { name: "Crear pedido" }).click();
    await expect(page.getByText("Escribe el nombre del cliente (de 2 a 80 letras)")).toBeVisible();
    await expect(page.getByText("Escribe la ciudad (de 2 a 60 letras)")).toBeVisible();
    await expect(page.getByText("Elige un producto", { exact: true })).toBeVisible();

    await page.getByLabel("Nombre del cliente").fill("Laura Méndez");
    await page.getByLabel("Ciudad").fill("Cuernavaca");
    await page.getByLabel("Producto 1", { exact: true }).selectOption({ label: "Gorra bordada · $299.00" });
    await page.getByLabel("Cantidad del producto 1").fill("3");
    await expect(page.getByTestId("order-total")).toHaveText("$897.00");

    await page.getByRole("button", { name: "Crear pedido" }).click();
    const toast = page.getByText(/¡Listo! Creamos el pedido OM-\d{5}\./);
    await expect(toast).toBeVisible();
    const orderNumber = (await toast.textContent())!.match(/OM-\d{5}/)![0];
    await expect(page).toHaveURL(/\/pedidos$/);

    const newRow = page.getByTestId(`order-row-${orderNumber}`);
    await expect(newRow).toBeVisible();
    await expect(newRow).toContainText("Laura Méndez");
    await expect(newRow).toContainText("$897.00");
    await expect(newRow).toContainText("Por preparar");
    await expect(page.locator("[data-testid^=order-row-]").first()).toHaveAttribute("data-testid", `order-row-${orderNumber}`);

    // Sigue ahí después de recargar, y el cliente quedó guardado para el siguiente pedido.
    await page.reload();
    await expect(page.getByTestId(`order-row-${orderNumber}`)).toContainText("Laura Méndez");
    await page.goto("/pedidos/nuevo");
    await expect(page.getByLabel("¿Para quién es?").locator("option", { hasText: "Laura Méndez · Cuernavaca" })).toHaveCount(1);
  });
});
