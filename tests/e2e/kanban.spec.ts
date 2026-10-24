import { expect, test } from "@playwright/test";
import { dragTo, resetData, signIn } from "./helpers";

// Flujo 3: Drag & Drop — arrastrar una tarjeta y comprobar que cambió de columna.
test.describe("Tablero (Drag & Drop)", () => {
  test.beforeEach(async ({ request, context, baseURL }) => {
    await resetData(request);
    await signIn(context, baseURL!);
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
});
