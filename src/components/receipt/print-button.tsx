"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

// Abre la ventana de impresión del navegador; ahí mismo se puede elegir "Guardar como PDF".
export function PrintButton() {
  return (
    <Button onClick={() => window.print()}>
      <Printer aria-hidden="true" />
      Imprimir o guardar PDF
    </Button>
  );
}
