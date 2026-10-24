// Formateadores de la interfaz. El dinero llega SIEMPRE en centavos (Int).

const LOCALE = "es-MX";
const TIME_ZONE = "America/Mexico_City";

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "MXN",
});

const numberFormatter = new Intl.NumberFormat(LOCALE);

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeZone: TIME_ZONE,
});

/** 189900 → "$1,899.00" */
export function formatCurrency(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

/** 12500 → "12,500" */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** 0.4123 → "41.2%" (recibe una proporción entre 0 y 1) */
export function formatPercent(ratio: number, fractionDigits = 1): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(ratio);
}

/** Fecha corta en horario de la Ciudad de México: "24 oct 2026" */
export function formatDate(date: Date | string): string {
  return dateFormatter.format(new Date(date));
}

/** 42 → "OM-00042" */
export function formatOrderNumber(number: number): string {
  return `OM-${String(number).padStart(5, "0")}`;
}