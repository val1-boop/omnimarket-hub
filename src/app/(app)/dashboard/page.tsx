import type { OrderStatus } from "@prisma/client";
import { AlertTriangle, ArrowRight, ClipboardList, Package, SquareKanban, Users } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AnalyticsSection } from "@/components/analytics/analytics-section";
import { AnalyticsSkeleton } from "@/components/analytics/analytics-skeleton";
import { PeriodFilter } from "@/components/analytics/period-filter";
import { StoreSwitchButton } from "@/components/layout/store-switch-button";
import { StockBadge } from "@/components/products/stock-badge";
import { SectionTitle } from "@/components/section-title";
import { buttonVariants } from "@/components/ui/button";
import { parsePeriod } from "@/lib/analytics";
import { formatNumber } from "@/lib/format";
import { LOW_STOCK_LIMIT } from "@/lib/inventory";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";
import { requireStoreContext } from "@/server/store";
import { cn } from "@/lib/utils";

// El recorrido de un pedido, en el orden en que avanza.
const JOURNEY: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

const SHORTCUTS = [
  {
    href: "/pedidos",
    icon: ClipboardList,
    title: "Pedidos",
    text: "Revisa, crea y cambia varios pedidos a la vez.",
    className: "bg-ink-900 text-white",
  },
  {
    href: "/kanban",
    icon: SquareKanban,
    title: "Tablero",
    text: "Arrastra cada pedido conforme va avanzando.",
    className: "bg-lilac-600 text-white",
  },
  {
    href: "/productos",
    icon: Package,
    title: "Productos",
    text: "Precios, costos, inventario y cuánto te deja cada uno.",
    className: "bg-lilac-100 text-ink-900",
  },
  {
    href: "/clientes",
    icon: Users,
    title: "Clientes",
    text: "Quién te compra, cuánto y qué pedidos ha hecho.",
    className: "border border-slate-200/80 bg-white text-ink-900",
  },
];

type DashboardPageProps = {
  searchParams: Promise<{ periodo?: string | string[] }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const period = parsePeriod((await searchParams).periodo);
  const { user, store } = await requireStoreContext();
  const [statusCounts, productCount, customerCount, lowStock] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], where: { storeId: store.id }, _count: { _all: true } }),
    prisma.product.count({ where: { storeId: store.id } }),
    prisma.customer.count({ where: { storeId: store.id } }),
    // Lo que se está acabando (o ya se acabó), primero lo que tiene menos piezas.
    prisma.product.findMany({
      where: { storeId: store.id, stock: { lte: LOW_STOCK_LIMIT } },
      select: { id: true, name: true, category: true, stock: true },
      orderBy: [{ stock: "asc" }, { name: "asc" }],
    }),
  ]);

  const firstName = user.name?.split(" ")[0];
  const countByStatus = new Map(statusCounts.map((row) => [row.status, row._count._all]));
  const countOf = (status: OrderStatus) => countByStatus.get(status) ?? 0;
  const onTheWay = countOf("PENDING") + countOf("PROCESSING") + countOf("SHIPPED");
  const orderCount = statusCounts.reduce((sum, row) => sum + row._count._all, 0);
  // Tienda recién creada (o sin pedidos todavía): en vez de cifras, se muestra cómo empezar.
  const isEmpty = orderCount === 0;

  return (
    <div className="space-y-10">
      {/* Portada */}
      <section className="relative grid overflow-hidden rounded-3xl bg-gradient-to-br from-lilac-100 via-lilac-50 to-white md:grid-cols-2">
        {/* Brillo decorativo de fondo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-lilac-300/40 blur-3xl"
        />
        <div className="relative min-w-0 p-8 md:p-12">
          <p className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-lilac-700 ring-1 ring-lilac-200">
            {firstName ? `¡Hola, ${firstName}!` : "¡Hola!"}
          </p>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink-900 md:text-5xl">
            {isEmpty ? "Tu tienda" : "Así va"}
            <br />
            <span className="text-gradient">{isEmpty ? "está lista." : "tu tienda."}</span>
          </h1>
          {isEmpty ? (
            <div data-testid="empty-store">
              <p className="mt-4 max-w-md text-sm text-slate-600">
                Todavía no registras pedidos, así que aún no hay ventas ni ganancias que mostrar. Tienes{" "}
                <strong className="text-ink-900">
                  {productCount === 1 ? "1 producto registrado" : `${formatNumber(productCount)} productos registrados`}
                </strong>
                . Empieza así:
              </p>
              <ol className="mt-3 max-w-md list-decimal space-y-1 pl-5 text-sm text-slate-600">
                <li>Agrega los productos que vendes, con su precio y lo que te cuestan.</li>
                <li>Registra tu primer pedido: puedes dar de alta al cliente ahí mismo.</li>
                <li>Mueve el pedido en el tablero conforme avance.</li>
              </ol>
            </div>
          ) : (
            <p className="mt-4 max-w-md text-sm text-slate-600">
              Ahorita tienes <strong className="text-ink-900">{formatNumber(onTheWay)} pedidos</strong> que todavía no
              llegan a su destino. Muévelos en el tablero conforme avancen para que nadie se quede esperando.
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {isEmpty ? (
              <>
                <Link
                  href={productCount === 0 ? "/productos/nuevo" : "/pedidos/nuevo"}
                  className={cn(buttonVariants({ variant: "lime" }), "group h-auto min-h-11 whitespace-normal py-1.5 pl-6 pr-1.5 text-center")}
                >
                  {productCount === 0 ? "Agregar mi primer producto" : "Registrar mi primer pedido"}
                  <ArrowCircle />
                </Link>
                {!store.isDemo && (
                  <StoreSwitchButton
                    to="demo"
                    label="Explorar la tienda de demostración"
                    // En celular el texto no cabe en una línea: puede bajar a dos.
                    className="h-auto min-h-11 whitespace-normal py-3 text-center"
                  />
                )}
              </>
            ) : (
              <>
                <Link href="/kanban" className={cn(buttonVariants({ variant: "lime" }), "group py-1.5 pl-6 pr-1.5")}>
                  Abrir tablero
                  <ArrowCircle />
                </Link>
                <Link href="/pedidos" className={buttonVariants({ variant: "outline" })}>
                  Ver pedidos
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Recorrido de los pedidos con números reales */}
        <div className="relative min-w-0 p-8 pt-0 md:p-12 md:pl-0">
          <div className="rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-lilac-200/70 backdrop-blur">
            <h2 className="font-display text-base font-bold text-ink-900">¿Dónde van tus pedidos?</h2>
            <ol className="mt-5 space-y-2.5">
              {JOURNEY.map((status, index) => (
                <li
                  key={status}
                  className="flex animate-rise items-center gap-4 rounded-xl bg-lilac-50 p-3.5"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-ink-900">{ORDER_STATUS_LABELS[status]}</span>
                  <span className="font-display text-xl font-extrabold text-ink-900">{formatNumber(countOf(status))}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-slate-600">Cancelados: {formatNumber(countOf("CANCELLED"))}</p>
          </div>
        </div>
      </section>

      {/* Franja oscura con el resumen de la tienda (números reales de ahorita) */}
      {!isEmpty && (
        <section aria-label="Resumen de tu tienda" className="rounded-3xl bg-ink-900 p-6 text-white md:p-8" data-testid="store-summary">
          <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[
              { label: "Pedidos por entregar", value: onTheWay, href: "/kanban" },
              { label: "Productos en tu catálogo", value: productCount, href: "/productos" },
              { label: "Clientes", value: customerCount, href: "/clientes" },
              { label: "Productos por agotarse", value: lowStock.length, href: lowStock.length > 0 ? "#por-agotarse" : "/productos" },
            ].map(({ label, value, href }, index) => (
              <div key={label} className="animate-rise" style={{ animationDelay: `${index * 70}ms` }}>
                <dt className="text-sm text-lilac-300">{label}</dt>
                <dd className="mt-1">
                  <Link href={href} className="font-display text-3xl font-extrabold tracking-tight hover:text-lima-300 md:text-4xl">
                    {formatNumber(value)}
                  </Link>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Aviso de inventario: lo que hay que volver a surtir */}
      {lowStock.length > 0 && (
        <section id="por-agotarse" aria-labelledby="por-agotarse-titulo" className="scroll-mt-28" data-testid="low-stock">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 id="por-agotarse-titulo" className="flex items-center gap-2 font-display text-base font-bold text-ink-900">
              <AlertTriangle className="h-5 w-5 text-amber-700" aria-hidden="true" />
              Se están acabando
            </h2>
            <p className="mt-1 text-sm text-slate-700">
              Productos con {LOW_STOCK_LIMIT} piezas o menos. Tócalos para actualizar su inventario cuando vuelvas a surtir.
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {lowStock.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/productos/${product.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-amber-100 transition-shadow hover:shadow-md"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink-900">{product.name}</span>
                      <span className="block text-xs text-slate-500">{product.category}</span>
                    </span>
                    <StockBadge stock={product.stock} className="shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Números de ventas del periodo elegido */}
      <section aria-labelledby="tus-numeros">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="tus-numeros" className="font-display text-xl font-bold tracking-tight text-ink-900">
            Tus números
          </h2>
          <PeriodFilter period={period} />
        </div>
        <Suspense key={period} fallback={<AnalyticsSkeleton />}>
          <AnalyticsSection period={period} storeId={store.id} />
        </Suspense>
      </section>

      {/* Accesos rápidos */}
      <section>
        <SectionTitle title="¿Qué quieres hacer?" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SHORTCUTS.map(({ href, icon: Icon, title, text, className }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex flex-col rounded-2xl p-6 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lg",
                className,
              )}
            >
              <Icon className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
              <p className="mt-6 font-display text-lg font-bold">{title}</p>
              <p className="mt-1 text-sm opacity-80">{text}</p>
              <ArrowRight className="mt-4 h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
// Círculo oscuro con flecha, dentro del botón verde lima (la flecha avanza al pasar el mouse).
function ArrowCircle() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-lima-300">
      <ArrowRight className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </span>
  );
}
