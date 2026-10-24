import { expect, test } from "@playwright/test";
import { E2E_USER, signIn } from "./helpers";

// Flujo 1: Autenticación — rutas privadas protegidas y sesión simulada.
test.describe("Autenticación", () => {
  test("sin sesión, las rutas privadas mandan al login", async ({ page }) => {
    for (const path of ["/dashboard", "/pedidos", "/kanban", "/productos"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login\?callbackUrl=/);
    }
    await expect(page.getByRole("heading", { name: "Entra a tu tienda" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar con GitHub" })).toBeVisible();
  });

  test("los botones de Google y GitHub inician OAuth con la dirección de regreso correcta", async ({ page }) => {
    const providers = [
      { button: "Continuar con Google", host: /accounts\.google\.com/, callback: "/api/auth/callback/google" },
      { button: "Continuar con GitHub", host: /github\.com\/login\/oauth/, callback: "/api/auth/callback/github" },
    ];
    for (const provider of providers) {
      // No salimos a internet: interceptamos la página del proveedor y revisamos a dónde nos mandó la app.
      await page.route(provider.host, (route) => route.fulfill({ status: 200, body: "proveedor OAuth" }));
      await page.goto("/login");
      await page.getByRole("button", { name: provider.button }).click();
      await page.waitForURL(provider.host);
      const redirectUri = new URL(page.url()).searchParams.get("redirect_uri");
      expect(redirectUri).toContain(provider.callback);
    }
  });

  test("con sesión entra a las rutas privadas y puede cerrar sesión", async ({ page, context, baseURL }) => {
    await signIn(context, baseURL!);

    await page.goto("/pedidos");
    await expect(page).toHaveURL(/\/pedidos$/);
    await expect(page.getByRole("heading", { name: "Pedidos" })).toBeVisible();

    // Con sesión iniciada, el login ya no tiene sentido: manda al inicio.
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(`¡Hola, ${E2E_USER.name.split(" ")[0]}!`)).toBeVisible();

    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?callbackUrl=/);
  });
});
