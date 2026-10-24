import { expect, type APIRequestContext, type BrowserContext, type Locator, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { encode } from "next-auth/jwt";

/** Acceso directo a la base de pruebas, solo para preparar escenarios y comprobar resultados. */
export const db = new PrismaClient();

export type TestUser = { id: string; name: string; email: string };

export const E2E_USER: TestUser = { id: "e2e-user", name: "Prueba Automática", email: "e2e@omnimarket.test" };
export const OTHER_USER: TestUser = { id: "e2e-user-2", name: "Otra Persona", email: "e2e-2@omnimarket.test" };

/**
 * Simula una sesión iniciada sin pasar por Google ni GitHub. Hace lo mismo que Auth.js al terminar
 * un inicio de sesión con OAuth: registra al usuario en la base (si no existe) y crea la cookie
 * de sesión cifrada, firmada con el AUTH_SECRET del proyecto.
 */
export async function signIn(context: BrowserContext, baseURL: string, user: TestUser = E2E_USER) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Falta AUTH_SECRET en el entorno para simular la sesión");

  await db.user.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, name: user.name, email: user.email },
  });

  const cookieName = "authjs.session-token";
  const value = await encode({
    token: { sub: user.id, name: user.name, email: user.email },
    secret,
    salt: cookieName,
  });
  await context.addCookies([{ name: cookieName, value, url: baseURL, httpOnly: true, sameSite: "Lax" }]);
}

/** Elige con qué tienda trabaja la sesión: la misma cookie que pone el botón de la app. */
export async function chooseStore(context: BrowserContext, baseURL: string, choice: "mia" | "demo") {
  await context.addCookies([{ name: "omnimarket-tienda", value: choice, url: baseURL, httpOnly: true, sameSite: "Lax" }]);
}

/** Borra al usuario de prueba y su tienda completa: el siguiente signIn es una cuenta nueva. */
export async function deleteTestUser(user: TestUser) {
  await db.user.deleteMany({ where: { id: user.id } });
}

/** Regresa la Tienda de demostración al conjunto de prueba conocido usando el endpoint de auditoría. */
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
