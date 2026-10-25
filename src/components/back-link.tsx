import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Flecha para regresar a la pantalla anterior.
export function BackLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="group mb-6 inline-flex items-center gap-2 text-sm font-semibold text-ink-900 hover:text-lilac-700"
    >
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
      {children}
    </Link>
  );
}
