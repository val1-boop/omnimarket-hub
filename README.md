# OmniMarket · Operations Hub

**De la caja a la puerta.** Dashboard de e-commerce para seguir ventas y pedidos en tiempo real: métricas de ventas, tabla de pedidos con edición en lote, tablero Kanban con Drag & Drop y catálogo de productos.

| | |
|---|---|
| **App en producción** | https://omnimarket-hub-brown.vercel.app |
| **Pipeline CI/CD** | [GitHub Actions](https://github.com/val1-boop/omnimarket-hub/actions) |
| **Inicio de sesión** | Google o GitHub (OAuth 2.0; no hay usuario/contraseña) |
| **Aviso de privacidad** | https://omnimarket-hub-brown.vercel.app/privacidad |

> Los productos, clientes y pedidos son **datos de prueba**. Se pueden restablecer con `POST /api/test/reset-data` (en producción hay que esperar 15 s entre un reinicio y otro).

---

## Lista de comprobación del evaluador

### 1. URL pública y autenticación OAuth
1. Abre https://omnimarket-hub-brown.vercel.app → sin sesión redirige a `/login`.
2. Entra con **Continuar con Google** o **Continuar con GitHub**.
3. Todas las rutas privadas (`/dashboard`, `/pedidos`, `/kanban`, `/productos`) están protegidas por middleware y vuelven a revisar la sesión en el servidor.

### 2. Latencia SLA de `GET /api/test/analytics`
```bash
curl "https://omnimarket-hub-brown.vercel.app/api/test/analytics?page=1&limit=50"
```
**Criterio de medición:** el límite de **300 ms** se mide como el **tiempo que tarda el servidor** en calcular y devolver las métricas. La app lo reporta en cada respuesta de dos formas:
- En el cuerpo: `meta.durationMs`.
- En el encabezado **`Server-Timing: app;dur=…`**.
  - **Chrome:** *F12 → Network → la petición → Timing → Server Timing*.
  - **Postman:** pestaña *Headers* de la respuesta.

El tiempo total que muestran Postman o `curl` suma además el viaje por internet entre tu computadora y el servidor. Ese viaje depende de dónde estés y de tu conexión, no de la app.

| Medición en producción (24 oct 2026, 20 peticiones desde México) | Resultado |
|---|---|
| Tiempo del servidor (`meta.durationMs`) | **13.8–36 ms** |
| Total reutilizando la conexión, como hacen el navegador y Postman | 0.21–0.33 s (la mayor parte es el viaje México ↔ Virginia) |
| Total abriendo una conexión nueva en cada petición | 0.43–1.6 s (incluye abrir la conexión cifrada) |

- Las funciones corren en `iad1` (Washington D.C.), la misma región que la base de datos.
- Si la app pasa un rato sin uso, Vercel la "apaga" y la siguiente petición tarda más; se llegaron a medir ~300 ms de servidor. Para evitarlo, el flujo **Mantener activa la app** (`.github/workflows/mantener-activa.yml`) la visita cada 15 minutos (GitHub puede retrasar o saltarse alguna visita).
- Para medir varias veces con la misma conexión:
  ```bash
  u="https://omnimarket-hub-brown.vercel.app/api/test/analytics?page=1&limit=50"
  curl -s -o /dev/null -o /dev/null -o /dev/null -o /dev/null -o /dev/null -w "total %{time_total} s\n" "$u" "$u" "$u" "$u" "$u"
  ```

### 3. Drag & Drop con persistencia
1. Entra a **Tablero** (`/kanban`) y arrastra una tarjeta a otra columna (o usa su botón *“Pasar a…”*).
2. La tarjeta se mueve al instante (actualización optimista) y aparece un aviso de confirmación. Si el servidor falla, regresa a su columna y el aviso lo indica.
3. Comprueba que quedó guardado:
   ```bash
   curl "https://omnimarket-hub-brown.vercel.app/api/test/kanban-status?order=OM-00298"
   ```

### 4. Pipeline de integración continua
En [Actions](https://github.com/val1-boop/omnimarket-hub/actions) cada commit de `main` muestra los dos trabajos en verde: **Lint, tipos y pruebas** → **Desplegar a producción (Vercel)**.

---

## Endpoints de auditoría

Son públicos (no requieren sesión) y responden JSON.

| Método y ruta | Parámetros | Qué hace |
|---|---|---|
| `GET /api/test/analytics` | `page` (≥ 1, por defecto 1), `limit` (1–100, por defecto 50) | `summary` (ventas, ganancia, margen, ticket promedio, pedidos por estado), `data` (página de pedidos con su ganancia y margen), `pagination` y `meta.durationMs` |
| `POST /api/test/reset-data` | — | Regresa productos, clientes y pedidos al conjunto de prueba conocido (24 productos, 40 clientes, 300 pedidos, 611 líneas). **No toca usuarios, cuentas ni sesiones** |
| `GET /api/test/kanban-status` | `order` (ej. `OM-00042`) o `id` | Estado y columna de un pedido. Sin parámetros: total por columna y los últimos 5 pedidos movidos |

Parámetros inválidos responden **400** con el motivo; un pedido inexistente responde **404**; un método distinto (por ejemplo `GET` a `reset-data`) responde **405**.

**Protecciones de `reset-data`** (para que no se pueda usar de forma indebida):
- Solo borra y vuelve a cargar los datos de prueba de la tienda; los usuarios y sus sesiones no se tocan.
- En producción hay que esperar **15 s** entre reinicios: antes de eso responde **429** con el encabezado `Retry-After`. Si llegan dos al mismo tiempo, solo uno se ejecuta.
- Si la petición viene de otra página web (por ejemplo un formulario oculto en un sitio ajeno) responde **403**. curl, Postman y PowerShell funcionan normal.

```bash
curl -X POST https://omnimarket-hub-brown.vercel.app/api/test/reset-data
curl "https://omnimarket-hub-brown.vercel.app/api/test/kanban-status"
```

---

## Cómo se cumple cada módulo

| Módulo | Implementación |
|---|---|
| **1. Arquitectura & Next.js 14+ (25 %)** | Next.js 15 con App Router, TypeScript estricto y Tailwind CSS 4. Server Components para leer datos y Server Actions validadas con Zod para escribir. Sin errores de consola |
| **2. Endpoints de auditoría (25 %)** | `src/app/api/test/*`. Consultas en paralelo con índices en PostgreSQL; región `iad1` junto a la base de datos |
| **3. Drag & Drop y CRUD avanzado (20 %)** | Kanban con `@dnd-kit` y mutación optimista (TanStack Query) con reversión y Toast. **Edición en lote**: en *Pedidos*, marcar varias casillas → *Pasar a…* o *Borrar*. CRUD de productos (crear, editar, borrar) y creación de pedidos |
| **4. Pruebas y CI/CD (15 %)** | 32 pruebas unitarias (Vitest) + 10 pruebas E2E (Playwright) que cubren los 3 flujos. `.github/workflows/ci.yml` bloquea el despliegue si algo falla, y la rama `main` está protegida: un Pull Request no se puede aceptar si las pruebas fallan |
| **5. Despliegue (15 %)** | Vercel con SSL. Solo la CI publica (`vercel.json` desactiva los despliegues automáticos) y después comprueba que producción responda |
| **UI/UX** | Skeletons en cada carga (`loading.tsx` y `Suspense`) y mientras se guarda un cambio (tabla, tablero y formularios), sin spinners. Toasts (Sonner) en cada cambio del tablero y edición en lote. Diseño adaptable a celular |

---

## Pruebas

### Unitarias — Vitest (`tests/unit`, 32 pruebas)
| Archivo | Cubre |
|---|---|
| `finance.test.ts` | Margen, ganancia, totales del pedido, **ticket promedio** (la misma fórmula que usan el panel y la API), pesos ↔ centavos |
| `format.test.ts` | **Formato de moneda** MXN, cantidades abreviadas, números, porcentajes, fechas en horario de CDMX |
| `validation.test.ts` | **Esquemas Zod**: producto, pedido, edición en lote, movimiento en el tablero, parámetros de la API |
| `filters.test.ts` | **Lógica de filtrado**: filtros de la dirección, número de pedido, búsqueda de pedidos y productos |
| `kanban-analytics.test.ts` | Mover tarjetas, siguiente paso, rangos de fechas, días sin ventas, comparación entre periodos |
| `reset-guard.test.ts` | Protecciones de `reset-data`: espera entre reinicios y bloqueo de otras páginas web |

### E2E — Playwright (`tests/e2e`, 10 pruebas)
| Flujo | Archivo | Comprueba |
|---|---|---|
| 1. Autenticación | `auth.spec.ts` | Rutas privadas redirigen al login; OAuth de Google y GitHub con la dirección de regreso correcta; **sesión simulada** (cookie JWT firmada con `AUTH_SECRET`) y cierre de sesión; aviso de privacidad público |
| 2. Creación | `creation.spec.ts` | Nuevo pedido aparece primero en la tabla; nuevo producto aparece en el catálogo |
| 3. Drag & Drop | `kanban.spec.ts` | La tarjeta cambia de columna, `/api/test/kanban-status` lo confirma y sigue ahí al recargar; mientras se guarda muestra un esqueleto |
| Endpoints | `api.spec.ts` | `reset-data` rechaza otras páginas web y `GET` sin cambiar nada; el ticket promedio del resumen cuadra con los pedidos, calculado pedido por pedido |

Antes de cada prueba se llama a `POST /api/test/reset-data`.

### Pipeline (`.github/workflows/ci.yml`)
- **En cada Pull Request:** instalar → migraciones en una base PostgreSQL desechable → lint → revisión de tipos → pruebas unitarias → build → pruebas E2E. Si algo falla, GitHub no deja aceptar el Pull Request.
- **En `main`:** lo mismo y, **solo si pasa**, migraciones en producción → `vercel build` → `vercel deploy --prebuilt --prod` → comprobación de que producción responde.
- **Cada 15 minutos** (`.github/workflows/mantener-activa.yml`): visita producción para que no se "duerma" y deja anotado el tiempo de cada respuesta. Solo lee datos.

---

## Correr el proyecto en tu computadora

Requisitos: Node.js 20 o superior y una base PostgreSQL (el proyecto usa Supabase).

```bash
npm install
cp .env.example .env        # y llena los valores
npx prisma migrate deploy   # crea las tablas
npm run db:seed             # carga los datos de prueba
npm run dev                 # http://localhost:3000
```

| Script | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilar y correr la versión de producción |
| `npm run lint` / `npm run typecheck` | Revisar el código y los tipos |
| `npm test` | Pruebas unitarias |
| `npm run test:e2e` | Pruebas E2E (antes: `npx playwright install chromium`). Reinician los datos de prueba de la base configurada en `.env` |
| `npm run db:seed` | Restablecer los datos de prueba |
| `npm run db:studio` | Ver la base de datos en el navegador |

Variables de entorno: ver `.env.example` (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID/SECRET`, `AUTH_GITHUB_ID/SECRET` y, opcional, `RESET_COOLDOWN_SECONDS`).

---

## Tecnologías
Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Auth.js v5 (Google y GitHub) · Prisma 6 · PostgreSQL (Supabase) · TanStack Query · @dnd-kit · Zod · React Hook Form · Recharts · Sonner · Vitest · Playwright · GitHub Actions · Vercel

## Estructura
```
src/
├── app/
│   ├── (app)/              # Páginas privadas: dashboard, pedidos, kanban, productos
│   ├── api/test/           # Endpoints de auditoría
│   ├── login/  privacidad/ # Páginas públicas
├── components/             # UI, tablero, pedidos, productos, gráficas
├── lib/                    # Cálculos, formatos, validaciones Zod, filtros (probados con Vitest)
├── server/                 # Acciones del servidor, consultas y datos de prueba
├── auth.ts  auth.config.ts  middleware.ts
prisma/                     # Esquema y migraciones
tests/unit  tests/e2e       # Vitest y Playwright
```
