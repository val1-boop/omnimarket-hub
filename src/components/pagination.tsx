import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  pageCount: number;
  total: number;
  hrefForPage: (page: number) => string;
};

export function Pagination({ page, pageCount, total, hrefForPage }: PaginationProps) {
  const disabled = "pointer-events-none opacity-40";
  return (
    <nav aria-label="Páginas" className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-slate-500">
        Página {formatNumber(page)} de {formatNumber(pageCount)} · {formatNumber(total)} en total
      </p>
      <div className="flex gap-2">
        <Link
          href={hrefForPage(page - 1)}
          aria-disabled={page <= 1}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), page <= 1 && disabled)}
        >
          <ArrowLeft aria-hidden="true" />
          Anterior
        </Link>
        <Link
          href={hrefForPage(page + 1)}
          aria-disabled={page >= pageCount}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), page >= pageCount && disabled)}
        >
          Siguiente
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </nav>
  );
}