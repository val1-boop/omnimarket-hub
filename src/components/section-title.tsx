import { ArrowRight } from "lucide-react";
import Link from "next/link";

// Título de sección con enlace opcional a la derecha ("Ver todo →").
export function SectionTitle({ title, href, linkLabel = "Ver todo" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-display text-xl font-bold tracking-tight text-ink-900">{title}</h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-semibold text-lilac-700 hover:text-ink-900"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}