import { expect, type APIRequestContext, type BrowserContext, type Locator, type Page } from "@playwright/test";
import { encode } from "next-auth/jwt";

export const E2E_USER = { name: "Prueba Automática", email: "e2e@omnimarket.test" };

/**
 * Simula una sesión iniciada sin pasar por Google ni GitHub: crea la misma cookie cifrada
 * que crea Auth.js después del login, firmada con el AUTH_SECRET del proyecto.
 */
export async function signIn(context: BrowserContext, baseURL: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Falta AUTH_SECRET en el entorno para simular la sesión");

  const cookieName = "authjs.session-token";
  const value = await encode({ token: { sub: "e2e-user", ...E2E_USER }, secret, salt: cookieName });
  await context.addCookies([{ name: cookieName, value, url: baseURL, httpOnly: true, sameSite: "Lax" }]);
}

/** Regresa la base de datos al conjunto de prueba conocido usando el endpoint de auditoría. */
export async function resetData(request: APIRequestContext) {
  const response = await request.post("/api/test/reset-data");
  if (!response.ok()) throw new Error(`reset-data respondió ${response.status()}`);
}

/** Arrastra un elemento hasta otro con el mouse, paso a paso (como lo haría una persona). */
export async function dragTo(page: Page, source: Locator, target: Locator) {
  // Espera a que la página termine de cargar y ambos elementos estén en pantalla.
  await expect(source).toBeVisible();
  await expect(target).toBeVisible();
  await page.waitForLoadState("networkidle");

  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error("No se encontró dónde arrastrar");

  await page.mouse.move(from.x + from.width / 2, from.y + 20);
  await page.mouse.down();
  // Primer movimiento corto: activa el arrastre (el tablero lo pide después de 6 px).
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + 30, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + 100, { steps: 15 });
  await page.mouse.up();
}
