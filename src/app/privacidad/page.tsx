import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = { title: "Política de privacidad — OmniMarket" };

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de privacidad" updatedAt="24 de octubre de 2026">
      <p>
        OmniMarket Operations Hub es un proyecto académico. Esta política explica qué datos personales usamos
        cuando inicias sesión y para qué.
      </p>
      <section className="space-y-2">
        <h2>Datos que recopilamos</h2>
        <p>Al iniciar sesión con Google o GitHub recibimos únicamente:</p>
        <ul>
          <li>Tu nombre.</li>
          <li>Tu correo electrónico.</li>
          <li>Tu foto de perfil.</li>
        </ul>
        <p>No solicitamos ni almacenamos contraseñas.</p>
      </section>
      <section className="space-y-2">
        <h2>Para qué los usamos</h2>
        <p>
          Solo para identificarte dentro de la aplicación y mostrar tu nombre y foto en la interfaz. No los usamos
          con fines publicitarios ni los vendemos o compartimos con terceros.
        </p>
      </section>
      <section className="space-y-2">
        <h2>Dónde se guardan</h2>
        <p>
          En una base de datos PostgreSQL alojada en Supabase. La sesión se mantiene mediante una cookie cifrada.
        </p>
      </section>
      <section className="space-y-2">
        <h2>Tus derechos</h2>
        <p>
          Puedes solicitar la eliminación de tus datos en cualquier momento a través del repositorio del proyecto:{" "}
          <a className="font-medium text-navy-900 underline" href="https://github.com/val1-boop/omnimarket-hub">
            github.com/val1-boop/omnimarket-hub
          </a>
          . También puedes revocar el acceso desde la configuración de seguridad de tu cuenta de Google o GitHub.
        </p>
      </section>
    </LegalPage>
  );
}