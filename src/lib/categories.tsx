import {
  Archive,
  BatteryCharging,
  Brush,
  Coffee,
  CookingPot,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  Headphones,
  Keyboard,
  LampDesk,
  Laptop,
  Milk,
  Monitor,
  Mouse,
  Shirt,
  Sofa,
  Sparkles,
  Speaker,
  SprayCan,
  Tag,
  Usb,
  Watch,
  Wind,
  type LucideIcon,
} from "lucide-react";

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
// Ícono según lo que es el producto, buscando palabras en su nombre (sin acentos ni mayúsculas).
// Así "Cafetera" y "Juego de Sartenes" no se ven iguales aunque los dos sean de Hogar.
// Si ninguna palabra coincide, se usa el ícono de su categoría.
const PRODUCT_KEYWORDS: [RegExp, LucideIcon][] = [
  [/audifono|audio/, Headphones],
  [/smartwatch|reloj/, Watch],
  [/bocina/, Speaker],
  [/cargador|bateria/, BatteryCharging],
  [/teclado/, Keyboard],
  [/mouse|raton/, Mouse],
  [/monitor|pantalla/, Monitor],
  [/\busb|\bhub\b/, Usb],
  [/laptop|computadora/, Laptop],
  [/tenis|zapato|calzado/, Footprints],
  [/sudadera|playera|camisa|chamarra|chaqueta/, Shirt],
  [/cafetera|\bcafe\b|taza/, Coffee],
  [/sarten|olla/, CookingPot],
  [/lampara/, LampDesk],
  [/organizador|caja/, Archive],
  [/botella|termo/, Milk],
  [/mancuerna|pesa/, Dumbbell],
  [/vela/, Flame],
  [/crema|locion|gel/, Droplets],
  [/brocha|pincel|maquillaje/, Brush],
  [/perfume|colonia/, SprayCan],
  [/secadora/, Wind],
];

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function getProductIcon(name: string, category: string): LucideIcon {
  const normalized = normalize(name);
  return PRODUCT_KEYWORDS.find(([pattern]) => pattern.test(normalized))?.[1] ?? getCategoryIcon(category);
}
