import { SalesChart } from "@/components/analytics/sales-chart";
import { StatTile } from "@/components/analytics/stat-tile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsPeriod } from "@/lib/analytics";
import { getCategoryIcon } from "@/lib/categories";
import { calculateMargin } from "@/lib/finance";
import { formatCurrency, formatDayKey, formatNumber, formatPercent } from "@/lib/format";
import { getSalesAnalytics } from "@/server/queries/analytics";

export async function AnalyticsSection({ period }: { period: AnalyticsPeriod }) {
  const { kpis, daily, categories, topProducts } = await getSalesAnalytics(period);

  if (kpis.orders === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
        <p className="font-display text-sm font-bold uppercase tracking-wider text-navy-900">Todavía no hay ventas</p>
        <p className="mt-1 text-sm text-slate-500">En los últimos {period} días no se registró ningún pedido.</p>
      </div>
    );
  }

  const maxCategory = Math.max(...categories.map((row) => row.revenueCents), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Vendiste" value={formatCurrency(kpis.revenueCents)} change={kpis.changes.revenue} period={period} />
        <StatTile
          label="Te quedó de ganancia"
          value={formatCurrency(kpis.profitCents)}
          detail={`Margen de ${formatPercent(kpis.marginRatio)}`}
          change={kpis.changes.profit}
          period={period}
        />
        <StatTile label="Pedidos" value={formatNumber(kpis.orders)} detail="Sin contar cancelados" change={kpis.changes.orders} period={period} />
        <StatTile
          label="Ticket promedio"
          value={formatCurrency(kpis.averageTicketCents)}
          detail="Lo que gasta cada cliente por pedido"
          change={kpis.changes.averageTicket}
          period={period}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ventas por día</CardTitle>
          <CardDescription>Lo que vendiste cada día, sin contar pedidos cancelados.</CardDescription>
        </CardHeader>
        <CardContent>
          <SalesChart data={daily} />
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-navy-900">
              Ver los números de cada día
            </summary>
            <div className="mt-3 max-h-64 overflow-y-auto">
              <table className="w-full text-left tabular-nums">
                <thead className="text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="py-2 font-semibold">Día</th>
                    <th scope="col" className="py-2 text-right font-semibold">Pedidos</th>
                    <th scope="col" className="py-2 text-right font-semibold">Ventas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...daily].reverse().map((row) => (
                    <tr key={row.day}>
                      <td className="py-2 text-navy-900">{formatDayKey(row.day, "long")}</td>
                      <td className="py-2 text-right text-slate-600">{formatNumber(row.orders)}</td>
                      <td className="py-2 text-right font-medium text-navy-900">{formatCurrency(row.revenueCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>¿Qué categoría vende más?</CardTitle>
            <CardDescription>Ventas y ganancia de cada categoría en el periodo.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4" aria-label="Ventas por categoría">
              {categories.map((row) => {
                const Icon = getCategoryIcon(row.category);
                return (
                  <li key={row.category}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-medium text-navy-900">
                        <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                        {row.category}
                      </span>
                      <span className="font-semibold text-navy-900">{formatCurrency(row.revenueCents)}</span>
                    </div>
                    <div className="mt-1.5 h-2.5 rounded-[2px] bg-slate-100">
                      <div
                        className="h-full rounded-r-[4px] bg-chart-1"
                        style={{ width: `${(row.revenueCents / maxCategory) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatNumber(row.pieces)} piezas · te dejó {formatCurrency(row.profitCents)} (
                      {formatPercent(calculateMargin(row.revenueCents, row.revenueCents - row.profitCents), 0)})
                    </p>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lo más vendido</CardTitle>
            <CardDescription>Los 5 productos con más piezas vendidas en el periodo.</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="py-2 font-semibold">#</th>
                  <th scope="col" className="py-2 font-semibold">Producto</th>
                  <th scope="col" className="py-2 text-right font-semibold">Piezas</th>
                  <th scope="col" className="py-2 text-right font-semibold">Ventas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {topProducts.map((product, index) => (
                  <tr key={product.id}>
                    <td className="py-3 font-display font-extrabold text-sand-700">{index + 1}</td>
                    <td className="py-3">
                      <p className="font-medium text-navy-900">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.category}</p>
                    </td>
                    <td className="py-3 text-right text-slate-600">{formatNumber(product.pieces)}</td>
                    <td className="py-3 text-right font-medium text-navy-900">{formatCurrency(product.revenueCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}