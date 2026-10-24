import type { OrderStatus } from "@prisma/client";
import { ArrowRight, ClipboardList, Package, SquareKanban } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AnalyticsSection } from "@/components/analytics/analytics-section";
import { AnalyticsSkeleton } from "@/components/analytics/analytics-skeleton";
import { StoreSwitchButton } from "@/components/layout/store-switch-button";
import { PeriodFilter } from "@/components/analytics/period-filter";
import { SectionTitle } from "@/components/section-title";
import { buttonVariants } from "@/components/ui/button";
import { parsePeriod } from "@/lib/analytics";
import { formatNumber } from "@/lib/format";
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
    cta: "Ir a pedidos",
    className: "bg-navy-900 text-white",
  },
  {
    href: "/kanban",
    icon: SquareKanban,
    title: "Tablero",
    text: "Arrastra cada pedido conforme va avanzando.",
    cta: "Abrir tablero",
    className: "bg-sand-600 text-white",
  },
  {
    href: "/productos",
    icon: Package,
    title: "Productos",
    text: "Precios, costos y cuánto te deja cada uno.",
    cta: "Ver productos",
    className: "bg-sand-100 text-navy-900",
  },
];

type DashboardPageProps = {
  searchParams: Promise<{ periodo?: string | string[] }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const period = parsePeriod((await searchParams).periodo);
  const { user, store } = await requireStoreContext();
  const [statusCounts, productCount] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], where: { storeId: store.id }, _count: { _all: true } }),
    prisma.product.count({ where: { storeId: store.id } }),
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
      <section className="grid overflow-hidden rounded-2xl bg-sand-50 md:grid-cols-2">
        <div className="p-8 md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand-700">
            {firstName ? `¡Hola, ${firstName}!` : "¡Hola!"}
          </p>
          <h1 className="mt-4 font-display text-4xl font-extrabold uppercase leading-tight text-navy-900 md:text-5xl">
            {isEmpty ? "Tu tienda" : "Así va"}
            <br />
            {isEmpty ? "está lista." : "tu tienda."}
          </h1>
          <p className="mt-3 font-script text-3xl text-sand-600">de la caja a la puerta</p>
          {isEmpty ? (
            <div data-testid="empty-store">
              <p className="mt-4 max-w-md text-sm text-slate-600">
                Todavía no registras pedidos, así que aún no hay ventas ni ganancias que mostrar. Tienes{" "}
                <strong className="text-navy-900">
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
              Ahorita tienes <strong className="text-navy-900">{formatNumber(onTheWay)} pedidos</strong> que todavía no
              llegan a su destino. Muévelos en el tablero conforme avancen para que nadie se quede esperando.
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {isEmpty ? (
              <>
                <Link href={productCount === 0 ? "/productos/nuevo" : "/pedidos/nuevo"} className={buttonVariants()}>
                  {productCount === 0 ? "Agregar mi primer producto" : "Registrar mi primer pedido"}
                  <ArrowRight aria-hidden="true" />
                </Link>
                {!store.isDemo && (
                  <StoreSwitchButton to="demo" label="Explorar la tienda de demostración" />
                )}
              </>
            ) : (
              <>
                <Link href="/kanban" className={buttonVariants()}>
                  Abrir tablero
                  <ArrowRight aria-hidden="true" />
                </Link>
                <Link href="/pedidos" className={buttonVariants({ variant: "outline" })}>
                  Ver pedidos
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Recorrido de los pedidos con números reales */}
        <div className="bg-sand-100 p-8 md:p-12">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-navy-900">
            ¿Dónde van tus pedidos?
          </h2>
          <ol className="mt-6 space-y-3">
            {JOURNEY.map((status, index) => (
              <li key={status} className="flex items-center gap-4 rounded-xl bg-white p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-navy-900">{ORDER_STATUS_LABELS[status]}</span>
                <span className="font-display text-xl font-extrabold text-navy-900">
                  {formatNumber(countOf(status))}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-slate-600">
            Cancelados: {formatNumber(countOf("CANCELLED"))}
          </p>
        </div>
      </section>

      {/* Números de ventas del periodo elegido */}
      <section aria-labelledby="tus-numeros">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="tus-numeros" className="font-display text-sm font-bold uppercase tracking-wider text-navy-900">
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
        <div className="grid overflow-hidden rounded-2xl md:grid-cols-3">
          {SHORTCUTS.map(({ href, icon: Icon, title, text, cta, className }) => (
            <Link key={href} href={href} className={cn("group flex items-center gap-5 p-8", className)}>
              <Icon className="h-10 w-10 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-wider">{title}</p>
                <p className="mt-1 text-sm opacity-80">{text}</p>
                <p className="mt-3 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider">
                  {cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}