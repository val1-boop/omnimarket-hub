import { ArrowRight } from "lucide-react";
import Link from "next/link";

// Título de sección en mayúsculas con enlace opcional a la derecha ("VER TODO →").
export function SectionTitle({ title, href, linkLabel = "Ver todo" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-navy-900">{title}</h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-navy-900 hover:text-sand-700"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}