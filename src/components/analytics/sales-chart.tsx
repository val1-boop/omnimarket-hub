"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailySales } from "@/lib/analytics";
import { formatCompactCurrency, formatCurrency, formatDayKey, formatNumber } from "@/lib/format";

// Colores de la gráfica tomados de la paleta: cambian solos con el modo claro u oscuro.
const SERIES_COLOR = "var(--color-chart-1)";

type TooltipProps = {
  active?: boolean;
  payload?: { payload: DailySales }[];
};

function SalesTooltip({ active, payload }: TooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
      <p className="text-sm font-semibold text-ink-900">{formatCurrency(point.revenueCents)}</p>
      <p className="text-xs text-slate-500">
        {formatDayKey(point.day, "long")} · {point.orders === 1 ? "1 pedido" : `${formatNumber(point.orders)} pedidos`}
      </p>
    </div>
  );
}

// Ventas de cada día: una sola serie, así que no necesita leyenda (el título dice qué es).
export function SalesChart({ data }: { data: DailySales[] }) {
  return (
    <div className="h-72 w-full" role="img" aria-label="Gráfica de ventas por día">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-slate-200)" />
          <XAxis
            dataKey="day"
            tickFormatter={(day: string) => formatDayKey(day)}
            interval="preserveStartEnd"
            minTickGap={32}
            tickLine={false}
            axisLine={{ stroke: "var(--color-slate-300)" }}
            tick={{ fill: "var(--color-slate-500)", fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(cents: number) => formatCompactCurrency(cents)}
            tickLine={false}
            axisLine={false}
            width={72}
            tick={{ fill: "var(--color-slate-500)", fontSize: 12 }}
          />
          <Tooltip content={<SalesTooltip />} cursor={{ stroke: "var(--color-slate-400)", strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="revenueCents"
            stroke={SERIES_COLOR}
            strokeWidth={2}
            fill={SERIES_COLOR}
            fillOpacity={0.1}
            activeDot={{ r: 5, stroke: "var(--color-white)", strokeWidth: 2, fill: SERIES_COLOR }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}