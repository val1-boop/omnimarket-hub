// Archivos CSV que se abren bien en Excel (y en Google Sheets o Numbers).

type Cell = string | number | null | undefined;

/**
 * Si una celda empieza con =, +, -, @ (o tabulador/retorno), Excel la trata como fórmula.
 * Un nombre de cliente como "=HIPERVINCULO(...)" podría ejecutarse al abrir el archivo,
 * así que se le antepone un apóstrofo para que quede como texto.
 */
function protectFormula(text: string): string {
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function escapeCell(cell: Cell): string {
  if (cell === null || cell === undefined) return "";
  const text = typeof cell === "number" ? String(cell) : protectFormula(cell);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Arma el CSV: encabezados + filas, separadas por comas y con saltos de línea de Windows.
 * Empieza con la marca BOM para que Excel lea bien los acentos y la ñ.
 */
export function toCsv(headers: string[], rows: Cell[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** Centavos → "1899.00" (con punto decimal y sin símbolo, para que Excel lo tome como número). */
export function centsToCsvNumber(cents: number): string {
  return (cents / 100).toFixed(2);
}

const dateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Mexico_City",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Fecha y hora de la Ciudad de México: { date: "2026-10-24", time: "18:05" }. */
export function mexicoCityDateTime(date: Date): { date: string; time: string } {
  const parts = Object.fromEntries(dateParts.formatToParts(date).map((part) => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}
