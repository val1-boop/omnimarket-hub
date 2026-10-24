"use client";

import { RotateCw } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

// Se muestra si una página privada falla al cargar (por ejemplo, si se cae la conexión).
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-sand-50 p-10 text-center">
      <p className="font-script text-3xl text-sand-600">¡Ups!</p>
      <h1 className="mt-2 font-display text-2xl font-extrabold uppercase text-navy-900">No pudimos cargar esto</h1>
      <p className="mt-3 text-sm text-slate-600">
        Puede ser un problema de conexión. Dale otra oportunidad en unos segundos.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RotateCw aria-hidden="true" />
          Intentar de nuevo
        </Button>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}