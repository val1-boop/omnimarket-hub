import { ArrowRight, ClipboardList, Gauge, Layers, Package, ShieldCheck, SquareKanban, Truck } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { SectionTitle } from "@/components/section-title";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  { icon: Gauge, title: "Métricas al instante", text: "Consultas en menos de 300 ms" },
  { icon: Layers, title: "Edición en lote", text: "Actualiza varios pedidos a la vez" },
  { icon: ShieldCheck, title: "Acceso seguro", text: "Inicio de sesión con Google y GitHub" },
];

const SHORTCUTS = [
  {
    href: "/pedidos",
    icon: ClipboardList,
    title: "Pedidos",
    text: "Consulta, crea y edita pedidos en lote.",
    cta: "Ver pedidos",
    className: "bg-navy-900 text-white",
  },
  {
    href: "/kanban",
    icon: SquareKanban,
    title: "Tablero Kanban",
    text: "Arrastra los pedidos entre estados.",
    cta: "Abrir tablero",
    className: "bg-sand-600 text-white",
  },
  {
    href: "/productos",
    icon: Package,
    title: "Catálogo",
    text: "Precios, costos y márgenes por producto.",
    cta: "Ver productos",
    className: "bg-sand-100 text-navy-900",
  },
];

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "equipo";

  return (
    <div className="space-y-10">
      {/* Portada */}
      <section className="grid overflow-hidden rounded-2xl bg-sand-50 md:grid-cols-2">
        <div className="p-8 md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand-700">Hola, {firstName}</p>
          <h1 className="mt-4 font-display text-4xl font-extrabold uppercase leading-tight text-navy-900 md:text-5xl">
            Operaciones.
            <br />
            En tiempo real.
          </h1>
          <p className="mt-3 font-script text-3xl text-sand-600">Ventas, pedidos y márgenes</p>
          <p className="mt-4 max-w-md text-sm text-slate-600">
            Supervisa el rendimiento de OmniMarket, mueve pedidos entre estados y actualiza tu catálogo desde un
            solo lugar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/pedidos" className={buttonVariants()}>
              Ver pedidos
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/kanban" className={buttonVariants({ variant: "outline" })}>
              Abrir Kanban
            </Link>
          </div>
        </div>

        <div className="relative hidden items-center justify-center bg-sand-100 p-12 md:flex">
          <div className="grid grid-cols-2 gap-4">
            {[ClipboardList, Truck, Package, SquareKanban].map((Icon, index) => (
              <div key={index} className="flex h-28 w-28 items-center justify-center rounded-xl bg-white shadow-sm">
                <Icon className="h-10 w-10 text-navy-900" strokeWidth={1.5} aria-hidden="true" />
              </div>
            ))}
          </div>
          <div className="absolute right-10 top-10 flex h-24 w-24 flex-col items-center justify-center rounded-full bg-navy-900 text-white">
            <span className="text-[10px] font-semibold uppercase tracking-wider">En vivo</span>
            <span className="font-display text-2xl font-extrabold">24/7</span>
          </div>
        </div>
      </section>

      {/* Franja de características */}
      <section className="grid gap-6 border-y border-slate-200 py-6 sm:grid-cols-3">
        {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-4">
            <Icon className="h-7 w-7 shrink-0 text-navy-900" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-navy-900">{title}</p>
              <p className="text-xs text-slate-500">{text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Accesos rápidos */}
      <section>
        <SectionTitle title="Accesos rápidos" />
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

      <p className="text-sm text-slate-500">Los indicadores y gráficas de ventas se agregan en la Fase 7.</p>
    </div>
  );
}