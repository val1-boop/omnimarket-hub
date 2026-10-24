import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = { title: "Términos y condiciones — OmniMarket" };

export default function TerminosPage() {
  return (
    <LegalPage title="Términos y condiciones" updatedAt="24 de octubre de 2026">
      <p>
        Al usar OmniMarket Operations Hub aceptas estos términos. La aplicación es un proyecto académico con fines
        de demostración y evaluación.
      </p>
      <section className="space-y-2">
        <h2>Uso del servicio</h2>
        <ul>
          <li>El acceso requiere iniciar sesión con una cuenta de Google o GitHub.</li>
          <li>Los productos, clientes y pedidos mostrados son datos de prueba ficticios.</li>
          <li>Los datos de prueba pueden restablecerse en cualquier momento sin previo aviso.</li>
        </ul>
      </section>
      <section className="space-y-2">
        <h2>Responsabilidad</h2>
        <p>
          El servicio se ofrece “tal cual”, sin garantías de disponibilidad. No debe usarse para operaciones
          comerciales reales.
        </p>
      </section>
      <section className="space-y-2">
        <h2>Privacidad</h2>
        <p>
          El tratamiento de tus datos se describe en la{" "}
          <Link className="font-medium text-navy-900 underline" href="/privacidad">
            política de privacidad
          </Link>
          .
        </p>
      </section>
    </LegalPage>
  );
}