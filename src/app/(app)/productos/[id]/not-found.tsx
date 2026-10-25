import Link from "next/link";
import { BackLink } from "@/components/back-link";
import { buttonVariants } from "@/components/ui/button";

// Se muestra si el producto ya no existe (por ejemplo, porque alguien lo borró).
export default function ProductoNoEncontrado() {
  return (
    <>
      <BackLink href="/productos">Volver a productos</BackLink>
      <div className="mx-auto max-w-md rounded-2xl bg-lilac-50 p-10 text-center">
        <p className="text-gradient font-display text-3xl font-extrabold">¡Ups!</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink-900">Este producto ya no existe</h1>
        <p className="mt-3 text-sm text-slate-600">Puede que lo hayan borrado. Revisa tu catálogo para ver lo que tienes.</p>
        <Link href="/productos" className={buttonVariants({ className: "mt-8" })}>
          Ver mi catálogo
        </Link>
      </div>
    </>
  );
}
