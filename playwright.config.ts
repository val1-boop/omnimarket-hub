import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  // Las pruebas cambian la base de datos (crean pedidos, mueven tarjetas): se corren una por una.
  fullyParallel: false,
  workers: 1,
  retries: isCI ? 1 : 0,
  forbidOnly: isCI,
  // En modo desarrollo cada página se compila la primera vez que se abre: damos tiempo de sobra.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    locale: "es-MX",
    timezoneId: "America/Mexico_City",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } }],
  // Levanta la app antes de las pruebas. En la CI usa la versión compilada (npm run build ya se corrió).
  webServer: {
    command: isCI ? "npm run start" : "npm run dev",
    url: `${baseURL}/login`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: { AUTH_TRUST_HOST: "true", PORT: String(PORT) },
  },
});
