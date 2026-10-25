import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { CustomersListSkeleton } from "@/components/customers/customers-list-skeleton";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { LiveSearch } from "@/components/live-search";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { SortSelect } from "@/components/sort-select";
import {
  CUSTOMER_SORT_LABELS,
  CUSTOMER_SORTS,
  getCustomersPage,
  parseCustomerSort,
  type CustomerSort,
} from "@/server/queries/customers";
import { requireStoreContext } from "@/server/store";

type ClientesPageProps = {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[]; orden?: string | string[] }>;
};

const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value) ?? "";

function clientesHref(q: string, page: number, sort: CustomerSort) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (sort !== "compras") params.set("orden", sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/clientes?${query}` : "/clientes";
}

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const params = await searchParams;
  const q = first(params.q).trim().slice(0, 80);
  const page = Math.max(1, Math.floor(Number(first(params.page))) || 1);
  const sort = parseCustomerSort(first(params.orden));

  return (
    <>
      <PageHeader
        eyebrow="Quién te compra"
        title="Clientes"
        description="Toca a un cliente para ver sus pedidos o corregir sus datos."
        actions={
          <Link href="/clientes/nuevo" className={buttonVariants()}>
            <Plus aria-hidden="true" />
            Nuevo cliente
          </Link>
        }
      />

      <LiveSearch
        path="/clientes"
        defaultValue={q}
        keep={sort !== "compras" ? { orden: sort } : {}}
        placeholder="Busca por nombre, ciudad o correo"
        label="Buscar clientes"
      />

      {/* La lista se pide dentro del Suspense: al buscar, el encabezado y el buscador se quedan
          en su lugar (sin perder lo que escribes) y solo la lista muestra el esqueleto. */}
      <Suspense key={`${q}|${page}|${sort}`} fallback={<CustomersListSkeleton />}>
        <CustomersResults q={q} page={page} sort={sort} />
      </Suspense>
    </>
  );
}

async function CustomersResults({ q, page, sort }: { q: string; page: number; sort: CustomerSort }) {
  const { store } = await requireStoreContext();
  const { rows, total, pageCount } = await getCustomersPage(store.id, q, page, sort);
  return (
    <>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center" data-testid="customers-empty">
          <p className="font-display text-base font-bold text-ink-900">
            {q ? "No encontramos a nadie así" : "Todavía no tienes clientes"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {q
              ? "Revisa cómo lo escribiste o busca solo una parte del nombre."
              : "Agrégalos aquí o al registrar un pedido con “+ Cliente nuevo”."}
          </p>
          {!q && (
            <Link href="/clientes/nuevo" className={buttonVariants({ className: "mt-6" })}>
              Agregar mi primer cliente
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="mb-3 flex justify-end">
            <SortSelect
              id="customers-sort"
              value={sort}
              options={CUSTOMER_SORTS.map((value) => ({ value, label: CUSTOMER_SORT_LABELS[value], href: clientesHref(q, 1, value) }))}
            />
          </div>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white" data-testid="customers-list">
            {rows.map((customer) => (
              <li key={customer.id}>
                <Link
                  href={`/clientes/${customer.id}`}
                  className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-slate-50 sm:px-6"
                  data-testid="customer-row"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sm font-bold text-white"
                  >
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink-900">{customer.name}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {customer.city}
                      {customer.lastOrderAt ? ` · último pedido el ${formatDate(customer.lastOrderAt)}` : " · sin pedidos"}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-display font-extrabold text-ink-900">{formatCurrency(customer.spentCents)}</span>
                    <span className="block text-xs text-slate-500">
                      {customer.orderCount === 1 ? "1 pedido" : `${formatNumber(customer.orderCount)} pedidos`}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">El monto es lo que ha comprado, sin contar pedidos cancelados.</p>
          <Pagination page={page} pageCount={pageCount} total={total} hrefForPage={(next) => clientesHref(q, next, sort)} />
        </>
      )}
    </>
  );
}
