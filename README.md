# OmniMarket · Operations Hub

**De la caja a la puerta.** Dashboard de e-commerce para seguir ventas y pedidos en tiempo real: métricas de ventas, tabla de pedidos con edición en lote, tablero Kanban con Drag & Drop y catálogo de productos.

| | |
|---|---|
| **App en producción** | https://omnimarket-hub-brown.vercel.app |
| **Pipeline CI/CD** | [GitHub Actions](https://github.com/val1-boop/omnimarket-hub/actions) |
| **Inicio de sesión** | Google o GitHub (OAuth 2.0; no hay usuario/contraseña) |
| **Aviso de privacidad** | https://omnimarket-hub-brown.vercel.app/privacidad |

> **Dos tiendas por cuenta.** Cada persona que entra tiene **“Mi tienda”**: privada, empieza vacía y solo ella ve lo que registra. Además, con el botón de la franja superior puede cambiarse a la **Tienda de demostración**: datos de ejemplo (24 productos, 40 clientes, 300 pedidos) compartidos por todos, marcados como ejemplo, que se restablecen con `POST /api/test/reset-data` (en producción hay que esperar 15 s entre un reinicio y otro).

---

## Lista de comprobación del evaluador

### 1. URL pública y autenticación OAuth
1. Abre https://omnimarket-hub-brown.vercel.app → sin sesión redirige a `/login`.
2. Entra con **Continuar con Google** o **Continuar con GitHub**, con **tu propia cuenta**. La app está publicada en Google y GitHub, así que cualquier cuenta puede entrar. No hace falta una cuenta de prueba ni contraseñas: la app no las tiene.
3. Todas las rutas privadas (`/dashboard`, `/pedidos`, `/kanban`, `/productos`) están protegidas por middleware y vuelven a revisar la sesión en el servidor.
4. Si entras con Google y otro día con GitHub usando el mismo correo, la app **no une las cuentas sola**: te pide entrar con el botón que usaste la primera vez.

### 1b. Cuenta nueva: empieza vacía y solo ve lo suyo
1. La primera vez que entras se crea tu **“Mi tienda”** (una sola, aunque entres muchas veces). El Inicio dice **“Tu tienda está lista”**, con 0 productos y 0 pedidos.
2. **Tus números** muestra **$0.00** vendido y **0** pedidos (un cero real), y **“—” / “Sin ventas para calcularla”** en ganancia y ticket promedio, porque sin ventas no se pueden calcular. No hay cifras de ejemplo.
3. **Productos → Agregar mi primer producto**, y luego **Pedidos → Nuevo pedido**: si todavía no tienes clientes, el formulario empieza en **“+ Cliente nuevo”** (nombre y ciudad).
4. El pedido aparece hasta arriba de la tabla, sigue ahí al recargar y al cerrar sesión y volver a entrar, y tus números se actualizan con él.
5. Para probar con otra cuenta (otro correo), verás que su tienda está vacía: no aparece nada de la primera.

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
1. Toca **“Ver la tienda de demostración”** (franja superior), entra a **Tablero** (`/kanban`) y arrastra una tarjeta a otra columna (o usa su botón *“Pasar a…”*). También funciona con los pedidos de tu propia tienda.
2. La tarjeta se mueve al instante (actualización optimista) y aparece un aviso de confirmación. Si el servidor falla, regresa a su columna y el aviso lo indica.
3. Comprueba que quedó guardado:
   ```bash
   curl "https://omnimarket-hub-brown.vercel.app/api/test/kanban-status?order=OM-00298"
   ```
   El endpoint es público, por eso **solo consulta la Tienda de demostración**: los pedidos de tu tienda privada responden 404, para no exponerlos.

### 4. Pipeline de integración continua
En [Actions](https://github.com/val1-boop/omnimarket-hub/actions) cada commit de `main` muestra los dos trabajos en verde: **Lint, tipos y pruebas** → **Desplegar a producción (Vercel)**. Después corre **Verificar producción**, que revisa la app ya publicada; su resumen está en la página de la ejecución.

---

## Endpoints de auditoría

Son públicos (no requieren sesión) y responden JSON. Por eso **solo trabajan con la Tienda de demostración**: nunca leen, devuelven ni borran datos de la tienda privada de nadie.

| Método y ruta | Parámetros | Qué hace |
|---|---|---|
| `GET /api/test/analytics` | `page` (≥ 1, por defecto 1), `limit` (1–100, por defecto 50) | `summary` (ventas, ganancia, margen, ticket promedio, pedidos por estado), `data` (página de pedidos con su ganancia y margen), `pagination` y `meta.durationMs` |
| `POST /api/test/reset-data` | — | Regresa la Tienda de demostración al conjunto de prueba conocido (24 productos, 40 clientes, 300 pedidos OM-00001…OM-00300, 611 líneas). **No toca usuarios, cuentas, sesiones ni la tienda de nadie** |
| `GET /api/test/kanban-status` | `order` (ej. `OM-00042`) o `id` | Estado y columna de un pedido de la Tienda de demostración. Sin parámetros: total por columna y los últimos 5 pedidos movidos |

Parámetros inválidos responden **400** con el motivo; un pedido inexistente responde **404**; un método distinto (por ejemplo `GET` a `reset-data`) responde **405**.

**Protecciones de `reset-data`** (para que no se pueda usar de forma indebida):
- Solo borra y vuelve a cargar los datos de la Tienda de demostración; los usuarios, sus sesiones y sus tiendas no se tocan.
- En producción hay que esperar **15 s** entre reinicios: antes de eso responde **429** con el encabezado `Retry-After`. Si llegan dos al mismo tiempo, solo uno se ejecuta.
- Si un reinicio falla, responde **500** sin cambiar nada (todo pasa en una sola transacción) y se puede volver a intentar de inmediato, sin esperar los 15 s.
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
| **3. Drag & Drop y CRUD avanzado (20 %)** | Kanban con `@dnd-kit` y mutación optimista (TanStack Query) con reversión y Toast. **Edición en lote**: en *Pedidos*, marcar varias casillas → *Pasar a…* o *Borrar*. CRUD de productos (crear, editar, borrar) y creación de pedidos (con cliente nuevo) |
| **Funciones de tienda** | **Detalle de pedido** (`/pedidos/[id]`): productos, cantidades, precio de cada uno, total, ganancia y cambio de paso. **Inventario**: crear un pedido aparta las piezas (si no alcanzan, no se guarda y se explica por qué); cancelar o borrar un pedido las regresa y reactivarlo las vuelve a apartar, todo dentro de una transacción. Aviso “Se están acabando” con 5 piezas o menos. **Clientes** (`/clientes`): lista con lo que ha comprado cada uno, búsqueda, historial de pedidos, edición y alta. **Fotos de productos**: se reducen en el navegador (máx. 800 px, WebP) y se guardan en PostgreSQL; solo las ve la tienda dueña. Sin foto, cada producto muestra un ícono de lo que es. **Página de cada producto** con piezas vendidas, lo vendido, lo que dejó y sus pedidos. **Comprobante del pedido** (`/comprobante/[id]`) para imprimir o guardar en PDF, siempre en colores claros; aclara que no es una factura fiscal. **Ordenar** pedidos por fecha, total o cliente, y clientes por compras, compra reciente o nombre |
| **Cuentas y datos** | Cada usuario tiene su tienda (`Store`, una por usuario). Todas las consultas y acciones filtran por la tienda que decide el servidor con la sesión; un id de otra tienda simplemente no se encuentra. Las cuentas de Google y GitHub no se unen solo por tener el mismo correo |
| **4. Pruebas y CI/CD (15 %)** | 49 pruebas unitarias (Vitest) + 33 pruebas E2E (Playwright) que cubren los 3 flujos. `.github/workflows/ci.yml` bloquea el despliegue si algo falla, y la rama `main` está protegida: un Pull Request no se puede aceptar si las pruebas fallan |
| **5. Despliegue (15 %)** | Vercel con SSL. Solo la CI publica (`vercel.json` desactiva los despliegues automáticos) y después comprueba que producción responda |
| **UI/UX** | Skeletons en cada carga (`loading.tsx` y `Suspense`) y mientras se guarda un cambio (tabla, tablero y formularios), sin spinners. Toasts (Sonner) en cada cambio del tablero y edición en lote. Diseño adaptable a celular. Animaciones con un propósito (carrusel de “Lo más vendido”, barras que crecen, resaltado del pedido que moviste, tarjetas que se elevan al pasar el mouse) que se apagan si el sistema pide menos movimiento. Sin librerías de pago: todo con CSS y Tailwind. **Modo claro y oscuro** con el botón del sol o la luna (la primera vez sigue el modo del sistema; la elección se guarda solo en el navegador), con contraste revisado en los dos |

---

## Pruebas

### Unitarias — Vitest (`tests/unit`, 49 pruebas)
| Archivo | Cubre |
|---|---|
| `finance.test.ts` | Margen, ganancia, totales del pedido, **ticket promedio** (la misma fórmula que usan el panel y la API), pesos ↔ centavos |
| `format.test.ts` | **Formato de moneda** MXN, cantidades abreviadas, números, porcentajes, fechas en horario de CDMX |
| `validation.test.ts` | **Esquemas Zod**: producto, pedido (con “Cliente nuevo”), edición en lote, movimiento en el tablero, parámetros de la API |
| `filters.test.ts` | **Lógica de filtrado y orden**: filtros de la dirección (un orden inventado se ignora), número de pedido, búsqueda de pedidos y productos, orden por fecha/total/cliente que siempre desempata por número |
| `kanban-analytics.test.ts` | Mover tarjetas, siguiente paso, rangos de fechas, días sin ventas, comparación entre periodos |
| `reset-guard.test.ts` | Protecciones de `reset-data`: espera entre reinicios y bloqueo de otras páginas web |
| `reset-data-route.test.ts` | Respuestas de `reset-data`: 200, 429 y, si el reinicio falla, 500 liberando la espera |
| `stores.test.ts` | La cookie de tienda solo acepta “mia” o “demo”: nunca un id de tienda que mande el navegador |
| `inventory.test.ts` | Qué pedidos apartan piezas, qué pasa al cancelar o reactivar, aviso de “por agotarse” |
| `customer-validation.test.ts` | Datos del cliente: limpieza, correo opcional y mensajes en español |
| `product-image.test.ts` | Fotos: tipo real de imagen por sus primeros bytes (rechaza SVG y texto), dirección de la foto; ícono de cada producto según su nombre |

### E2E — Playwright (`tests/e2e`, 33 pruebas)
| Flujo | Archivo | Comprueba |
|---|---|---|
| 1. Autenticación | `auth.spec.ts` | Rutas privadas redirigen al login; OAuth de Google y GitHub con la dirección de regreso correcta; **sesión simulada** (usuario en la base + cookie JWT firmada con `AUTH_SECRET`, igual que al terminar OAuth) y cierre de sesión; aviso de privacidad público |
| 2. Creación | `creation.spec.ts` | Con una **cuenta nueva**: primer producto en el catálogo; primer pedido con cliente nuevo hasta arriba de la tabla; ambos siguen tras recargar |
| 3. Drag & Drop | `kanban.spec.ts` | La tarjeta cambia de columna, `/api/test/kanban-status` lo confirma y sigue ahí al recargar; mientras se guarda muestra un esqueleto |
| Endpoints | `api.spec.ts` | `reset-data` rechaza otras páginas web y `GET` sin cambiar nada; el ticket promedio del resumen cuadra con los pedidos, calculado pedido por pedido |
| Cuentas y tiendas | `tiendas.spec.ts` | **Primer inicio**: una sola tienda, vacía, sin datos ajenos ni cifras inventadas. **Recurrente**: no duplica tienda y conserva datos. **Aislamiento**: otra cuenta no ve nada y las métricas (vendido, ganancia, margen, ticket) cuadran con la base. **Persistencia** al cerrar y volver a entrar. **Protección**: abrir el producto de otra cuenta, consultarlo por el endpoint y **manipular la petición** para mover su pedido → todo rechazado. Cambio entre “Mi tienda” y la de demostración |
| Funciones de tienda | `funciones.spec.ts` | **Detalle de pedido** con cantidades, precios y total iguales a la base (desde la tabla y desde el tablero). **Inventario**: baja al vender, no deja vender de más, regresa al cancelar o borrar, se vuelve a apartar al reactivar; agotado no se puede elegir. **Clientes**: lo comprado, historial, edición, correo repetido, borrado; búsqueda y páginas. **Aislamiento**: otra cuenta no abre pedidos ni clientes ajenos. **Fotos**: se suben reducidas a WebP, solo las ve su tienda (otra cuenta o sin sesión → 404), se rechaza un archivo que no es foto, se pueden quitar y se guardan al crear un producto |
| Detalles | `detalles.spec.ts` | **Números del producto** iguales a la base (piezas, lo vendido y la ganancia, pedido por pedido) y cada pedido una sola vez. **Comprobante**: productos, total, aviso de que no es factura, sin costos ni ganancias, sin botones al imprimir; otra cuenta no lo abre. **Ordenar** pedidos (encabezados y selector, se conserva al buscar) y clientes (se conserva al cambiar de página) |
| Experiencia | `ux.spec.ts` | Páginas "no encontrado" en español con flecha para regresar (y 404 en direcciones inexistentes); el formulario de edición llega lleno desde el servidor; todos los campos de la tabla de pedidos tienen `id` o `name`; el botón de modo oscuro cambia los colores y se recuerda, y sin elección se usa el modo del sistema |

Las pruebas que usan datos de ejemplo llaman antes a `POST /api/test/reset-data` y trabajan en la Tienda de demostración; las de cuentas borran antes a sus usuarios de prueba para empezar como cuentas nuevas.

### Pipeline (`.github/workflows/ci.yml`)
- **En cada Pull Request:** instalar → migraciones en una base PostgreSQL desechable → lint → revisión de tipos → pruebas unitarias → build → pruebas E2E. Si algo falla, GitHub no deja aceptar el Pull Request.
- **En `main`:** lo mismo y, **solo si pasa**, migraciones en producción → `vercel build` → `vercel deploy --prebuilt --prod` → comprobación de que producción responde.
- **Después de cada publicación** (`.github/workflows/verificar-produccion.yml`, también a mano con *Run workflow*): revisa la app publicada con `scripts/verificar-produccion.mjs`. Comprueba:
  - páginas y rutas protegidas;
  - que Google y GitHub abran con la dirección de regreso correcta;
  - endpoints y latencia;
  - una sesión en una cuenta nueva y en la Tienda de demostración, con la consola abierta;
  - un movimiento en el tablero.
  Al terminar restablece la Tienda de demostración y borra el usuario temporal que usó. El resumen aparece en la página de cada ejecución en Actions.
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
| `npm run test:e2e` | Pruebas E2E (antes: `npx playwright install chromium`). Reinician la Tienda de demostración y crean y borran los usuarios de prueba (`e2e-user`, `e2e-user-2`) en la base configurada en `.env`: úsala con una base de pruebas, no la de producción |
| `npm run db:seed` | Restablecer la Tienda de demostración (no toca las tiendas de los usuarios) |
| `npm run db:studio` | Ver la base de datos en el navegador |

Variables de entorno: ver `.env.example` (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID/SECRET`, `AUTH_GITHUB_ID/SECRET` y, opcional, `RESET_COOLDOWN_SECONDS`).

---

## Tecnologías
Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Auth.js v5 (Google y GitHub) · Prisma 6 · PostgreSQL (Supabase) · TanStack Query · @dnd-kit · Zod · React Hook Form · Recharts · Sonner · Vitest · Playwright · GitHub Actions · Vercel

## Estructura
```
src/
├── app/
│   ├── (app)/              # Páginas privadas: inicio, pedidos, tablero, productos, clientes
│   ├── api/test/           # Endpoints de auditoría
│   ├── login/  privacidad/ # Páginas públicas
├── components/             # UI, tablero, pedidos, productos, gráficas
├── lib/                    # Cálculos, formatos, validaciones Zod, filtros (probados con Vitest)
├── server/                 # Acciones del servidor, consultas y datos de prueba
├── auth.ts  auth.config.ts  middleware.ts
prisma/                     # Esquema y migraciones
tests/unit  tests/e2e       # Vitest y Playwright
```
