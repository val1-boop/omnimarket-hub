import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getStoreContext } from "@/server/store";

// Las páginas privadas dependen de la sesión y de la base de datos: se generan en cada visita
// (así `npm run build` no intenta consultar la base de datos).
export const dynamic = "force-dynamic";

// Layout de todas las páginas privadas: encabezado + contenido + pie de página.
export default async function AppLayout({ children }: { children: ReactNode }) {
  // Segunda barrera de seguridad (la primera es el middleware). La primera vez que alguien
  // entra, aquí se crea su tienda propia (vacía); las siguientes veces solo se recupera.
  const context = await getStoreContext();
  if (!context) redirect("/login");

  return (
    <AppShell user={context.user} store={{ name: context.store.name, isDemo: context.store.isDemo }}>
      {children}
    </AppShell>
  );
}