import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Flecha para regresar a la pantalla anterior.
export function BackLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-navy-900 hover:text-sand-700"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {children}
    </Link>
  );
}
