import { describe, expect, it } from "vitest";
import { formatCurrency } from "@/lib/format";

// PRUEBA QUE FALLA A PROPÓSITO (evidencia D13 de la auditoría): demuestra que la CI
// se pone en rojo y que GitHub no deja aceptar el Pull Request. Este PR se cierra sin aceptar.
describe("demostración de bloqueo de la CI", () => {
  it("falla a propósito", () => {
    expect(formatCurrency(10_000)).toBe("$999.99");
  });
});
