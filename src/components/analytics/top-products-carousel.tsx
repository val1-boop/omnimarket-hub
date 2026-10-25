"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getCategoryIcon } from "@/lib/categories";
import { formatCurrency, formatNumber } from "@/lib/format";
import { StockBadge } from "@/components/products/stock-badge";

export type TopProduct = {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  stock: number;
  pieces: number;
  revenueCents: number;
};

// Carrusel de "Lo más vendido": en celular se desliza con el dedo; en computadora, con las flechas.
// Las flechas se apagan cuando ya no hay más tarjetas hacia ese lado.
export function TopProductsCarousel({ products }: { products: TopProduct[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () =>
      setEdges({
        start: track.scrollLeft <= 4,
        end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4,
      });
    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Avanza casi una pantalla, dejando ver un pedacito de la tarjeta que sigue.
  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (track) track.scrollBy({ left: direction * track.clientWidth * 0.85 });
  };

  return (
    <section aria-labelledby="lo-mas-vendido" aria-roledescription="carrusel" data-testid="top-products">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 id="lo-mas-vendido" className="font-display text-xl font-bold tracking-tight text-ink-900">
            Lo más vendido
          </h2>
          <p className="mt-1 text-sm text-slate-500">Los productos con más piezas vendidas en el periodo.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <ArrowButton label="Ver los anteriores" disabled={edges.start} onClick={() => scrollBy(-1)}>
            <ArrowLeft />
          </ArrowButton>
          <ArrowButton label="Ver los siguientes" disabled={edges.end} onClick={() => scrollBy(1)}>
            <ArrowRight />
          </ArrowButton>
        </div>
      </div>

      <ul ref={trackRef} className="snap-carousel -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {products.map((product, index) => {
          const Icon = getCategoryIcon(product.category);
          return (
            <li
              key={product.id}
              className="w-[78%] shrink-0 animate-rise sm:w-[45%] lg:w-[23.5%]"
              style={{ animationDelay: `${Math.min(index, 4) * 70}ms` }}
              data-testid="top-product"
            >
              <Link
                href={`/productos/${product.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-lilac-200/60"
              >
                <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-lilac-100 via-lilac-50 to-white">
                  <Icon
                    className="h-12 w-12 text-ink-900 transition-transform duration-300 group-hover:scale-110"
                    strokeWidth={1.25}
                    aria-hidden="true"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-ink-900 px-2.5 py-1 text-[11px] font-bold text-white">
                    #{index + 1}
                  </span>
                  <StockBadge stock={product.stock} className="absolute right-3 top-3" />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-xs text-slate-500">{product.category}</p>
                  <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold text-ink-900">{product.name}</h3>
                  <div className="mt-auto flex items-end justify-between gap-2 pt-4">
                    <div>
                      <p className="font-display text-lg font-extrabold text-ink-900">{formatNumber(product.pieces)}</p>
                      <p className="text-xs text-slate-500">piezas vendidas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ink-900">{formatCurrency(product.revenueCents)}</p>
                      <p className="text-xs text-slate-500">a {formatCurrency(product.priceCents)} c/u</p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ArrowButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-ink-900 transition-colors hover:border-ink-900 hover:bg-ink-900 hover:text-white disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-4"
    >
      {children}
    </button>
  );
}
