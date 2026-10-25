import { describe, expect, it } from "vitest";
import { centsToCsvNumber, mexicoCityDateTime, toCsv } from "@/lib/csv";

describe("archivo CSV para Excel", () => {
  it("empieza con BOM (acentos bien en Excel), separa con comas y termina cada línea en CRLF", () => {
    const csv = toCsv(["Cliente", "Total (MXN)"], [["Sofía Núñez", "2998.00"]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toBe("﻿Cliente,Total (MXN)\r\nSofía Núñez,2998.00\r\n");
  });

  it("pone entre comillas lo que trae comas, comillas o saltos de línea", () => {
    const csv = toCsv(["A"], [['Taza "grande", azul'], ["dos\nlíneas"]]);
    expect(csv).toContain('"Taza ""grande"", azul"');
    expect(csv).toContain('"dos\nlíneas"');
  });

  it("evita que un texto se ejecute como fórmula al abrirlo en Excel", () => {
    const csv = toCsv(["Cliente"], [["=HYPERLINK(\"http://x\")"], ["+52 777"], ["@SUMA(A1)"], ["-1"]]);
    expect(csv).toContain(`"'=HYPERLINK(""http://x"")"`);
    expect(csv).toContain("'+52 777");
    expect(csv).toContain("'@SUMA(A1)");
    expect(csv).toContain("'-1");
    // Los números de verdad no se tocan.
    expect(toCsv(["N"], [[-5]])).toContain("\r\n-5\r\n");
  });

  it("escribe dinero con punto decimal y fechas con la hora de la Ciudad de México", () => {
    expect(centsToCsvNumber(189990)).toBe("1899.90");
    expect(centsToCsvNumber(5)).toBe("0.05");
    // 03:30 UTC del 25 de octubre = 21:30 del 24 de octubre en CDMX (UTC−6).
    expect(mexicoCityDateTime(new Date("2026-10-25T03:30:00Z"))).toEqual({ date: "2026-10-24", time: "21:30" });
  });
});
