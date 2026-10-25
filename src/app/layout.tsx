import type { Metadata, Viewport } from "next";
import { Geist, Montserrat } from "next/font/google";
import { Providers } from "@/components/providers";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Geist: texto general · Montserrat: títulos.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const DESCRIPTION = "Ventas, pedidos, inventario y clientes de tu tienda en un solo lugar.";

export const metadata: Metadata = {
  // Dirección pública: la usan la vista previa al compartir el enlace (WhatsApp, correo, redes).
  metadataBase: new URL(process.env.SITE_URL ?? "https://omnimarket-hub-brown.vercel.app"),
  title: "OmniMarket · De la caja a la puerta",
  description: DESCRIPTION,
  applicationName: "OmniMarket",
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "OmniMarket",
    title: "OmniMarket · De la caja a la puerta",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: "OmniMarket · De la caja a la puerta", description: DESCRIPTION },
  // Solo si Google pide comprobar que el dominio es tuyo (Google Search Console).
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

// Color de la barra del navegador en celular, según el modo del sistema.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0b1f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: el script de abajo pone data-theme antes de que React cargue.
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${geistSans.variable} ${montserrat.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}