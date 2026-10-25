import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del cliente (de 2 a 80 letras)").max(80, "Máximo 80 letras"),
  city: z.string().trim().min(2, "Escribe la ciudad (de 2 a 60 letras)").max(60, "Máximo 60 letras"),
  // El correo es opcional: vacío se guarda como "sin correo" (null). Acepta también null, que es
  // lo que llega al servidor cuando el formulario ya lo limpió en el navegador.
  email: z
    .string()
    .nullish()
    .transform((value) => (value ?? "").trim().toLowerCase())
    .pipe(
      z
        .string()
        .max(120, "El correo es muy largo")
        .refine((value) => value === "" || z.email().safeParse(value).success, "Revisa el correo: le falta algo (ej. nombre@correo.com)"),
    )
    .transform((value) => value || null),
});

export type CustomerInput = z.input<typeof customerSchema>;
export type CustomerValues = z.output<typeof customerSchema>;
