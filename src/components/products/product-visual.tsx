import Image from "next/image";
import { getProductIcon } from "@/lib/categories";
import { cn } from "@/lib/utils";

type ProductVisualProps = {
  name: string;
  category: string;
  imageUrl: string | null;
  /** Clases del contenedor (alto, bordes). El contenedor siempre es "relative". */
  className?: string;
  iconClassName?: string;
  /** Tamaños aproximados en pantalla, para que el navegador elija bien (atributo sizes). */
  sizes?: string;
};

// La "imagen" de un producto: su foto si tiene una; si no, el ícono de lo que es sobre un degradado lila.
export function ProductVisual({ name, category, imageUrl, className, iconClassName, sizes = "300px" }: ProductVisualProps) {
  const Icon = getProductIcon(name, category);
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden", !imageUrl && "bg-gradient-to-br from-lilac-100 via-lilac-50 to-white", className)}>
      {imageUrl ? (
        // unoptimized: la foto ya viene reducida y es privada (necesita la sesión del navegador).
        <Image src={imageUrl} alt={name} fill unoptimized sizes={sizes} className="object-cover transition-transform duration-300 group-hover:scale-105" data-testid="product-photo" />
      ) : (
        <Icon className={cn("text-ink-900", iconClassName)} strokeWidth={1.25} aria-hidden="true" />
      )}
    </div>
  );
}
