import { PageHeader } from "@/components/page-header";
import { SectionTitle } from "@/components/section-title";
import { getCategoryIcon } from "@/lib/categories";
import { formatNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function ProductosPage() {
  const categories = await prisma.product.groupBy({
    by: ["category"],
    _count: { _all: true },
    orderBy: { category: "asc" },
  });

  return (
    <>
      <PageHeader
        eyebrow="Tu catálogo"
        title="Productos"
        description="Lo que vendes, a cuánto lo vendes y cuánto te deja cada uno."
      />

      <section>
        <SectionTitle title="Por categoría" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map(({ category, _count }) => {
            const Icon = getCategoryIcon(category);
            return (
              <div
                key={category}
                className="flex flex-col items-center gap-3 rounded-xl bg-slate-50 px-4 py-6 text-center"
              >
                <Icon className="h-10 w-10 text-navy-900" strokeWidth={1.5} aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-navy-900">{category}</p>
                  <p className="text-xs text-slate-500">{formatNumber(_count._all)} productos</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="mt-10 text-sm text-slate-500">
        Muy pronto vas a poder ver aquí cada producto y dar de alta nuevos.
      </p>
    </>
  );
}