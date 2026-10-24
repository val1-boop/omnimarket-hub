import { Dumbbell, Headphones, Laptop, Shirt, Sofa, Sparkles, Tag, type LucideIcon } from "lucide-react";

// Ícono de cada categoría (se usa como "imagen" de los productos y en las tarjetas de categoría).
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Electrónica: Headphones,
  Computación: Laptop,
  Ropa: Shirt,
  Hogar: Sofa,
  Deportes: Dumbbell,
  Belleza: Sparkles,
};

export function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? Tag;
}