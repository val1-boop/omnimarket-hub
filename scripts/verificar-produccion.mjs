// Verificación de la app publicada. La corre GitHub Actions (flujo "Verificar producción"):
// a mano con "Run workflow" y sola después de cada publicación en main.
// Revisa lo mismo que revisaría el evaluador: páginas, inicio de sesión con Google y GitHub,
// endpoints de auditoría, latencia, una sesión en "Mi tienda" y en la Tienda de demostración
// (con la consola del navegador abierta) y un movimiento en el tablero. Al final deja la
// Tienda de demostración como al principio y borra el usuario temporal que usó.

import { PrismaClient } from "@prisma/client";
import { appendFileSync } from "node:fs";
import { encode } from "next-auth/jwt";
import { chromium } from "playwright";

const BASE = process.env.PRODUCTION_URL ?? "https://omnimarket-hub-brown.vercel.app";
const sections = [];
let failures = 0;

function section(title) {
  const lines = [];
  sections.push({ title, lines });
  return {
    ok: (text) => lines.push(`✅ ${text}`),
    fail: (text) => {
      failures += 1;
      lines.push(`❌ ${text}`);
      console.log(`::error title=${title}::${text}`);
    },
    info: (text) => lines.push(`ℹ️ ${text}`),
    check(condition, text) {
      if (condition) this.ok(text);
      else this.fail(text);
    },
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Google y GitHub meten la dirección de regreso codificada varias veces dentro de la suya.
function findRedirectUri(url) {
  let text = url;
  for (let i = 0; i < 4; i++) {
    try {
      text = decodeURIComponent(text);
    } catch {
      break;
    }
  }
  return text.match(/redirect_uri=([^&\s]+)/)?.[1] ?? null;
}

async function timed(path, init) {
  const started = performance.now();
  const response = await fetch(BASE + path, { redirect: "manual", ...init });
  const body = await response.text();
  const totalMs = Math.round(performance.now() - started);
  let json = null;
  try {
    json = JSON.parse(body);
  } catch {
    // No todas las respuestas son JSON.
  }
  return { status: response.status, headers: response.headers, json, totalMs };
}

async function resetDemo() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await timed("/api/test/reset-data", { method: "POST" });
    if (response.status !== 429) return response;
    await sleep((Number(response.headers.get("retry-after")) || 15) * 1000 + 1000);
  }
  return timed("/api/test/reset-data", { method: "POST" });
}

// 1. Páginas públicas, SSL y protección de rutas (sin sesión).
async function checkPages() {
  const s = section("Páginas y SSL");
  for (const path of ["/login", "/privacidad"]) {
    const { status } = await timed(path);
    s.check(status === 200, `${path} → HTTP ${status}`);
  }
  for (const path of ["/dashboard", "/pedidos", "/kanban", "/productos"]) {
    const { status, headers } = await timed(path);
    const location = headers.get("location") ?? "";
    s.check(status === 307 && location.includes("/login"), `${path} sin sesión → ${status} a ${location.replace(BASE, "") || "(nada)"}`);
  }
  s.ok(`Certificado SSL válido (la conexión HTTPS con ${new URL(BASE).host} se verificó al conectar)`);
}

// 2. Inicio de sesión: los dos botones abren Google y GitHub con la dirección de regreso correcta.
async function checkOAuth(browser) {
  const s = section("Inicio de sesión (OAuth)");
  const providers = (await timed("/api/auth/providers")).json ?? {};
  for (const id of ["google", "github"]) {
    s.check(providers[id]?.callbackUrl === `${BASE}/api/auth/callback/${id}`, `Proveedor ${id} configurado (${providers[id]?.callbackUrl ?? "falta"})`);
  }

  const page = await browser.newPage();
  // Primera petición que la app manda a cada proveedor: ahí va la dirección de regreso.
  const firstRequest = {};
  page.on("request", (request) => {
    const host = new URL(request.url()).host;
    if (host === "accounts.google.com") firstRequest.google ??= request.url();
    if (host === "github.com") firstRequest.github ??= request.url();
  });

  await page.goto(`${BASE}/login`);
  await page.getByRole("button", { name: "Continuar con Google" }).click();
  await page.waitForURL(/accounts\.google\.com/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  const googleRedirect = findRedirectUri(firstRequest.google ?? page.url());
  const googleText = await page.locator("body").innerText();
  s.check(googleRedirect === `${BASE}/api/auth/callback/google`, `Google abre su pantalla con redirect_uri ${googleRedirect}`);
  s.check(!/redirect_uri_mismatch|Error 400|Acceso bloqueado|Access blocked/i.test(googleText), "Google no muestra error de configuración");

  await page.goto(`${BASE}/login`);
  await page.getByRole("button", { name: "Continuar con GitHub" }).click();
  await page.waitForURL(/github\.com/, { timeout: 30_000 });
  const githubRedirect = findRedirectUri(firstRequest.github ?? page.url());
  s.check(githubRedirect === `${BASE}/api/auth/callback/github`, `GitHub abre su pantalla con redirect_uri ${githubRedirect}`);
  await page.close();
  s.info("Completar el inicio de sesión necesita una cuenta real de Google o GitHub: eso no se automatiza.");
}

// 3. Endpoints de auditoría y latencia.
async function checkEndpoints() {
  const s = section("Endpoints de auditoría");
  const cases = [
    ["/api/test/analytics?page=1&limit=50", 200],
    ["/api/test/analytics?page=6&limit=50", 200],
    ["/api/test/analytics?page=0", 400],
    ["/api/test/analytics?limit=101", 400],
    ["/api/test/analytics?page=abc", 400],
    ["/api/test/kanban-status", 200],
    ["/api/test/kanban-status?order=OM-00042", 200],
    ["/api/test/kanban-status?order=OM-99999", 404],
    ["/api/test/kanban-status?order=hola", 400],
  ];
  for (const [path, expected] of cases) {
    const { status } = await timed(path);
    s.check(status === expected, `${path} → ${status} (esperado ${expected})`);
  }
  const first = (await timed("/api/test/analytics?page=1&limit=50")).json;
  const ids = new Set();
  for (let page = 1; page <= (first?.pagination?.totalPages ?? 0); page++) {
    (await timed(`/api/test/analytics?page=${page}&limit=50`)).json?.data?.forEach((order) => ids.add(order.id));
  }
  s.check(ids.size === first?.pagination?.total, `Paginación: ${ids.size} pedidos únicos de ${first?.pagination?.total}`);
  const { status: getReset } = await timed("/api/test/reset-data");
  s.check(getReset === 405, `GET /api/test/reset-data → ${getReset} (esperado 405)`);
  const { status: crossSite } = await timed("/api/test/reset-data", { method: "POST", headers: { Origin: "https://sitio-ajeno.example" } });
  s.check(crossSite === 403, `POST /api/test/reset-data desde otra página web → ${crossSite} (esperado 403)`);

  const l = section("Latencia de /api/test/analytics?page=1&limit=50");
  const server = [];
  const total = [];
  for (let i = 0; i < 20; i++) {
    const response = await timed("/api/test/analytics?page=1&limit=50");
    server.push(response.json?.meta?.durationMs ?? Infinity);
    total.push(response.totalMs);
  }
  const sorted = (values) => [...values].sort((a, b) => a - b);
  const [s1, t1] = [sorted(server), sorted(total)];
  l.check(s1.at(-1) < 300, `Servidor (meta.durationMs), 20 peticiones: mín ${s1[0]} · mediana ${s1[10]} · máx ${s1.at(-1)} ms`);
  l.info(`Total visto desde GitHub Actions (EE. UU.), conexión reutilizada: mín ${t1[0]} · mediana ${t1[10]} · máx ${t1.at(-1)} ms. Desde otros lugares cambia según la red.`);
}

// 4. Sesión en "Mi tienda" (nueva, vacía) y en la Tienda de demostración, con la consola abierta.
async function checkSession(browser) {
  const s = section("Sesión, tiendas, consola y tablero");
  const secret = process.env.AUTH_SECRET;
  if (!secret || !process.env.DATABASE_URL) {
    // No es una falla de la app: falta con qué simular la sesión. Se reporta como no verificado.
    s.info("NO VERIFICADO: faltan AUTH_SECRET o DATABASE_URL de producción para simular la sesión.");
    console.log("::warning title=Sesión::No se pudo simular la sesión en producción (faltan credenciales)");
    return;
  }

  const db = new PrismaClient();
  const runId = process.env.GITHUB_RUN_ID ?? String(Date.now());
  const user = { id: `auditoria-ci-${runId}`, name: "Auditoría Automática", email: `auditoria-ci-${runId}@omnimarket.test` };
  const context = await browser.newContext();
  try {
    // Lo mismo que hace Auth.js al terminar un inicio de sesión: el usuario en la base y la cookie cifrada.
    await db.user.create({ data: user });
    // En HTTPS (producción) Auth.js usa el prefijo __Secure- en el nombre de la cookie.
    const secure = BASE.startsWith("https://");
    const cookieName = `${secure ? "__Secure-" : ""}authjs.session-token`;
    const value = await encode({ token: { sub: user.id, name: user.name, email: user.email }, secret, salt: cookieName });
    await context.addCookies([{ name: cookieName, value, url: BASE, httpOnly: true, secure, sameSite: "Lax" }]);

    const page = await context.newPage();
    const problems = [];
    page.on("console", (message) => message.type() === "error" && problems.push(`${new URL(page.url()).pathname}: ${message.text().slice(0, 150)}`));
    page.on("pageerror", (error) => problems.push(`${new URL(page.url()).pathname}: ${error.message.slice(0, 150)}`));

    const visit = async (path) => {
      const response = await page.goto(BASE + path);
      await page.waitForLoadState("networkidle");
      return response?.status();
    };

    // Cuenta nueva: su tienda empieza vacía.
    s.check((await visit("/dashboard")) === 200 && (await page.getByTestId("empty-store").count()) === 1, "Cuenta nueva: el Inicio dice “Tu tienda está lista” (sin datos de nadie más)");
    s.check((await visit("/productos")) === 200 && (await page.getByTestId("catalog-empty").count()) === 1, "Cuenta nueva: Productos vacío");
    s.check((await visit("/pedidos")) === 200 && (await page.getByTestId("orders-empty").count()) === 1, "Cuenta nueva: Pedidos vacío");
    s.check((await visit("/kanban")) === 200 && (await page.locator("[data-testid^=kanban-card-]").count()) === 0, "Cuenta nueva: Tablero sin tarjetas");
    s.check((await db.store.count({ where: { ownerId: user.id } })) === 1, "Se creó exactamente una tienda para la cuenta nueva");

    // Tienda de demostración: todas las páginas y un movimiento en el tablero.
    await context.addCookies([{ name: "omnimarket-tienda", value: "demo", url: BASE, httpOnly: true, secure, sameSite: "Lax" }]);
    for (const path of ["/dashboard", "/pedidos", "/pedidos/nuevo", "/productos", "/productos/nuevo", "/productos/prod_011", "/privacidad"]) {
      const status = await visit(path);
      s.check(status === 200, `Tienda de demostración: ${path} → HTTP ${status}`);
    }
    await visit("/kanban");
    const card = page.getByTestId("kanban-column-PENDING").locator("[data-testid^=kanban-card-]").first();
    const orderNumber = (await card.getAttribute("data-testid"))?.replace("kanban-card-", "");
    await card.getByRole("button", { name: /Pasar a Preparándose/ }).click();
    await page.getByText(`${orderNumber} ahora está en “Preparándose”.`).waitFor({ timeout: 15_000 });
    const status = (await timed(`/api/test/kanban-status?order=${orderNumber}`)).json?.order?.status;
    s.check(status === "PROCESSING", `Tablero: ${orderNumber} se movió, apareció el aviso y kanban-status responde ${status}`);
    await page.reload();
    await page.waitForLoadState("networkidle");
    s.check((await page.getByTestId("kanban-column-PROCESSING").getByTestId(`kanban-card-${orderNumber}`).count()) === 1, `Tablero: ${orderNumber} sigue en “Preparándose” después de recargar`);

    s.check(problems.length === 0, problems.length ? `Errores en la consola: ${problems.join(" | ")}` : "Consola del navegador sin errores en todas las páginas");
  } catch (error) {
    s.fail(`La revisión con sesión se interrumpió: ${error.message.slice(0, 200)}`);
  } finally {
    await context.close();
    await db.user.deleteMany({ where: { id: user.id } });
    s.info("El usuario temporal y su tienda se borraron al terminar.");
    await db.$disconnect();
  }
}

// 5. Reinicio final: la Tienda de demostración queda como al principio.
async function checkReset() {
  const s = section("Reinicio de la Tienda de demostración");
  const reset = await resetDemo();
  const counts = reset.json?.counts;
  s.check(reset.status === 200 && counts?.orders === 300 && counts?.products === 24 && counts?.customers === 40 && counts?.orderItems === 611, `POST /api/test/reset-data → ${reset.status} ${JSON.stringify(counts ?? reset.json)}`);
  const summary = (await timed("/api/test/analytics?page=1&limit=1")).json;
  s.check(summary?.pagination?.total === 300 && summary?.summary?.soldOrders === 289 && summary?.summary?.averageTicket === "$4,636.38", `Después: ${summary?.pagination?.total} pedidos, ${summary?.summary?.soldOrders} vendidos, ticket ${summary?.summary?.averageTicket}`);
}

const browser = await chromium.launch();
try {
  for (const step of [checkPages, () => checkOAuth(browser), checkEndpoints, () => checkSession(browser), checkReset]) {
    try {
      await step();
    } catch (error) {
      section("Error inesperado").fail(error.message.slice(0, 300));
    }
  }
} finally {
  await browser.close();
}

// Resumen: en la consola, como anotaciones (una por sección) y en la página del flujo en GitHub.
const markdown = [`# Verificación de producción · ${BASE}`, ""];
for (const { title, lines } of sections) {
  console.log(`\n## ${title}\n${lines.join("\n")}`);
  console.log(`::notice title=${title}::${lines.join("%0A")}`);
  markdown.push(`## ${title}`, ...lines.map((line) => `- ${line}`), "");
}
markdown.push(failures === 0 ? "**Resultado: todo correcto.**" : `**Resultado: ${failures} comprobación(es) fallaron.**`);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown.join("\n") + "\n");
process.exit(failures === 0 ? 0 : 1);
