import { describe, expect, it } from "vitest";
import { customerSchema } from "@/lib/validation/customer";

describe("datos de un cliente", () => {
  it("limpia espacios, guarda el correo en minúsculas y deja el correo vacío como 'sin correo'", () => {
    expect(customerSchema.parse({ name: "  Laura Méndez ", city: " Cuernavaca ", email: " Laura@Correo.MX " })).toEqual({
      name: "Laura Méndez",
      city: "Cuernavaca",
      email: "laura@correo.mx",
    });
    expect(customerSchema.parse({ name: "Laura", city: "Cuernavaca", email: "" }).email).toBeNull();
    // Lo que ya limpió el formulario (null) se vuelve a aceptar en el servidor.
    const cleaned = customerSchema.parse({ name: "Laura", city: "Cuernavaca", email: "" });
    expect(customerSchema.parse(cleaned).email).toBeNull();
  });

  it("explica qué falta en español", () => {
    const result = customerSchema.safeParse({ name: "L", city: "", email: "laura@" });
    expect(result.success).toBe(false);
    expect(result.error!.issues.map((issue) => issue.message)).toEqual([
      "Escribe el nombre del cliente (de 2 a 80 letras)",
      "Escribe la ciudad (de 2 a 60 letras)",
      "Revisa el correo: le falta algo (ej. nombre@correo.com)",
    ]);
  });
});
