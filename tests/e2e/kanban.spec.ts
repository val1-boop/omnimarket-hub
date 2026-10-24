import { expect, test } from "@playwright/test";
import { chooseStore, dragTo, resetData, signIn } from "./helpers";

// Flujo 3: Drag & Drop — arrastrar una tarjeta y comprobar que cambió de columna.
test.describe("Tablero (Drag & Drop)", () => {
  test.beforeEach(async ({ request, context, baseURL }) => {
    await resetData(request);
    await signIn(context, baseURL!);
    // Estas pruebas necesitan datos: trabajan en la Tienda de demostración.
    await chooseStore(context, baseURL!, "demo");
  });

  test("arrastrar un pedido a otra columna lo mueve y queda guardado", async ({ page, request }) => {
    await page.goto("/kanban");
    const pending = page.getByTestId("kanban-column-PENDING");
    const processing = page.getByTestId("kanban-column-PROCESSING");

    const card = pending.locator("[data-testid^=kanban-card-]").first();
    const cardId = (await card.getAttribute("data-testid"))!;
    const orderNumber = cardId.replace("kanban-card-", "");

    await dragTo(page, card, processing);

    // Cambio optimista: la tarjeta aparece en la nueva columna y sale de la anterior.
    await expect(processing.getByTestId(cardId)).toBeVisible();
    await expect(pending.getByTestId(cardId)).toHaveCount(0);
    await expect(page.getByText(`${orderNumber} ahora está en “Preparándose”.`)).toBeVisible();

    // El servidor lo guardó: el endpoint de auditoría lo confirma...
    const status = await (await request.get(`/api/test/kanban-status?order=${orderNumber}`)).json();
    expect(status.order.status).toBe("PROCESSING");

    // ...y sigue ahí después de recargar.
    await page.reload();
    await expect(page.getByTestId("kanban-column-PROCESSING").getByTestId(cardId)).toBeVisible();
  });

  test("mientras se guarda un movimiento, la tarjeta muestra un esqueleto", async ({ page }) => {
    // Hacemos lento el guardado (las acciones del servidor son POST a la misma página) para alcanzar a verlo.
    await page.route("**/kanban", async (route) => {
      if (route.request().method() === "POST") await new Promise((resolve) => setTimeout(resolve, 1_500));
      await route.continue();
    });
    await page.goto("/kanban");

    const card = page.getByTestId("kanban-column-PENDING").locator("[data-testid^=kanban-card-]").first();
    const cardId = (await card.getAttribute("data-testid"))!;
    await card.getByRole("button", { name: /Pasar a Preparándose/ }).click();

    const moved = page.getByTestId("kanban-column-PROCESSING").getByTestId(cardId);
    await expect(moved.getByTestId("saving-skeleton")).toBeVisible();
    await expect(moved).toHaveAttribute("aria-busy", "true");

    // Al terminar de guardar, el esqueleto se quita.
    await expect(page.getByText(/ahora está en “Preparándose”/)).toBeVisible();
    await expect(moved.getByTestId("saving-skeleton")).toHaveCount(0);
  });
});
