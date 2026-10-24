import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

type StatTileProps = {
  label: string;
  value: string;
  detail?: string;
  /**
   * Cambio contra el periodo anterior (0.12 = +12 %). null si no hay datos completos para comparar;
   * sin valor, no se muestra ninguna comparación.
   */
  change?: number | null;
  period: number;
};

export function StatTile({ label, value, detail, change, period }: StatTileProps) {
  const comparison = `vs los ${period} días anteriores`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5" data-testid="stat-tile">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 font-display text-2xl font-extrabold text-navy-900">{value}</p>
      {detail && <p className="text-xs text-slate-500">{detail}</p>}
      {change !== undefined && (
        <p className="mt-3 flex items-center gap-1 text-xs">
          {change === null ? (
            <span className="text-slate-500">Aún no hay datos de los {period} días anteriores para comparar</span>
          ) : (
            <>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-semibold",
                  change > 0 && "text-emerald-700",
                  change < 0 && "text-rose-700",
                  change === 0 && "text-slate-600",
                )}
              >
                {change > 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                ) : change < 0 ? (
                  <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {change > 0 ? "+" : ""}
                {formatPercent(change)}
              </span>
              <span className="text-slate-500">{comparison}</span>
            </>
          )}
        </p>
      )}
    </div>
  );
}