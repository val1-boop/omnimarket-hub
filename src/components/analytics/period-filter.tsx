import Link from "next/link";
import { ANALYTICS_PERIODS, type AnalyticsPeriod } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function PeriodFilter({ period }: { period: AnalyticsPeriod }) {
  return (
    <nav aria-label="Periodo" className="flex flex-wrap gap-2">
      {ANALYTICS_PERIODS.map((days) => (
        <Link
          key={days}
          href={days === 30 ? "/dashboard" : `/dashboard?periodo=${days}`}
          scroll={false}
          aria-current={days === period ? "page" : undefined}
          className={cn(
            "rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
            days === period
              ? "border-navy-900 bg-navy-900 text-white"
              : "border-slate-300 bg-white text-slate-600 hover:border-navy-900 hover:text-navy-900",
          )}
        >
          Últimos {days} días
        </Link>
      ))}
    </nav>
  );
}