import { describe, expect, it } from "vitest";
import { getProductIcon } from "@/lib/categories";
import { detectImageType, productImageUrl } from "@/lib/product-image";
import { Coffee, CookingPot, Headphones, Keyboard, Sofa, SprayCan, Usb } from "lucide-react";

describe("fotos de productos", () => {
  it("reconoce el tipo real de imagen por sus primeros bytes, no por el nombre", () => {
    expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    expect(detectImageType(webp)).toBe("image/webp");
    // Un archivo de texto o un SVG (que puede traer código) no se acepta.
    expect(detectImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(detectImageType(new Uint8Array([]))).toBeNull();
  });

  it("arma la dirección de la foto con la fecha para que el navegador pida la nueva al cambiarla", () => {
    expect(productImageUrl({ id: "p1", imageUpdatedAt: null })).toBeNull();
    expect(productImageUrl({ id: "p1", imageUpdatedAt: new Date(1000) })).toBe("/api/productos/p1/foto?v=1000");
  });
});

describe("ícono de cada producto", () => {
  it("elige el ícono por lo que dice el nombre, sin importar acentos ni mayúsculas", () => {
    expect(getProductIcon("Cafetera de Goteo", "Hogar")).toBe(Coffee);
    expect(getProductIcon("Juego de Sartenes", "Hogar")).toBe(CookingPot);
    expect(getProductIcon("Audífonos Inalámbricos Pro", "Electrónica")).toBe(Headphones);
    expect(getProductIcon("TECLADO mecánico", "Computación")).toBe(Keyboard);
    expect(getProductIcon("Hub USB-C 7 en 1", "Computación")).toBe(Usb);
    expect(getProductIcon("Perfume Citrus 100ml", "Belleza")).toBe(SprayCan);
  });

  it("si no reconoce el nombre, usa el ícono de la categoría", () => {
    expect(getProductIcon("Sillón reclinable", "Hogar")).toBe(Sofa);
  });
});
