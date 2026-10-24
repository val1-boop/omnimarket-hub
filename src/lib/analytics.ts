// Ayudantes del panel de números. Son funciones "puras" (sin base de datos) para poder probarlas.

export const ANALYTICS_PERIODS = [7, 30, 90] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

const DAY_MS = 24 * 60 * 60 * 1000;
// La Ciudad de México usa UTC-6 todo el año (ya no hay horario de verano desde 2022).
const MEXICO_CITY_OFFSET = "-06:00";

/** Lee el periodo de la dirección (?periodo=7). Si viene algo raro, usa 30 días. */
export function parsePeriod(value: string | string[] | undefined): AnalyticsPeriod {
  const number = Number(Array.isArray(value) ? value[0] : value);
  return ANALYTICS_PERIODS.find((period) => period === number) ?? 30;
}

/** Fecha en formato AAAA-MM-DD según el calendario de la Ciudad de México. */
export function toMexicoDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(date);
}

/** Suma (o resta) días a una fecha AAAA-MM-DD. */
export function addDaysToKey(key: string, days: number): string {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day) + days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Rango del periodo: los últimos `days` días contando hoy, y el periodo anterior del mismo largo
 * (para comparar). Las fechas empiezan a la medianoche de la Ciudad de México.
 */
export function getPeriodRange(days: number, now = new Date()) {
  const firstDay = addDaysToKey(toMexicoDateKey(now), -(days - 1));
  const from = new Date(`${firstDay}T00:00:00${MEXICO_CITY_OFFSET}`);
  const previousFrom = new Date(from.getTime() - days * DAY_MS);
  const dayKeys = Array.from({ length: days }, (_, index) => addDaysToKey(firstDay, index));
  return { from, previousFrom, dayKeys };
}

export type DailySales = { day: string; revenueCents: number; orders: number };

/** Completa con ceros los días sin ventas, para que la gráfica no se "salte" días. */
export function fillDailySeries(dayKeys: string[], rows: DailySales[]): DailySales[] {
  const byDay = new Map(rows.map((row) => [row.day, row]));
  return dayKeys.map((day) => byDay.get(day) ?? { day, revenueCents: 0, orders: 0 });
}

/** Cambio contra el periodo anterior: 120 vs 100 → 0.2 (20 %). Sin datos anteriores → null. */
export function calculateChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}