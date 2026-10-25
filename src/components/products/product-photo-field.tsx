"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { ProductVisual } from "@/components/products/product-visual";
import { Button } from "@/components/ui/button";
import { SavingSkeleton } from "@/components/ui/skeleton";

type ProductPhotoFieldProps = {
  name: string;
  category: string;
  /** Foto guardada (al editar) o null. */
  imageUrl: string | null;
  /** Foto elegida que todavía no se guarda (al crear un producto). */
  pending: Blob | null;
  busy: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
};

// Vista previa de la foto con botones para subirla, cambiarla o quitarla.
export function ProductPhotoField({ name, category, imageUrl, pending, busy, onPick, onRemove }: ProductPhotoFieldProps) {
  const inputId = useId();
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  // Vista previa local de la foto elegida (se libera al cambiarla para no gastar memoria).
  useEffect(() => {
    if (!pending) {
      setPendingUrl(null);
      return;
    }
    const url = URL.createObjectURL(pending);
    setPendingUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pending]);

  const shown = pendingUrl ?? imageUrl;

  return (
    <div className="sm:col-span-2">
      <p className="text-sm font-medium text-ink-900">Foto (opcional)</p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center">
        <ProductVisual
          name={name || "Producto"}
          category={category}
          imageUrl={shown}
          className="h-36 w-full shrink-0 rounded-xl ring-1 ring-slate-200 sm:w-48"
          iconClassName="h-12 w-12"
          sizes="192px"
        />
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            Una foto clara del producto, de frente y con buena luz. La reducimos sola para que cargue rápido.
          </p>
          <div className="flex flex-wrap gap-2">
            {/* El botón es una etiqueta del campo de archivo: así se abre la galería o la cámara del celular. */}
            <label
              htmlFor={inputId}
              aria-disabled={busy || undefined}
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-ink-900 transition-colors hover:border-ink-900 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:size-4"
            >
              {busy ? (
                <SavingSkeleton label="Guardando foto…" />
              ) : (
                <>
                  <ImagePlus aria-hidden="true" />
                  {shown ? "Cambiar foto" : "Subir foto"}
                </>
              )}
            </label>
            <input
              id={inputId}
              name="foto"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/*"
              className="sr-only"
              disabled={busy}
              data-testid="product-photo-input"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onPick(file);
                event.target.value = ""; // permite volver a elegir la misma foto
              }}
            />
            {shown && (
              <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50" disabled={busy} onClick={onRemove}>
                <Trash2 aria-hidden="true" />
                Quitar foto
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
