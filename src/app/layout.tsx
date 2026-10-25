import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "OmniMarket · De la caja a la puerta",
  description: "Sigue tus ventas y tus pedidos de OmniMarket, desde que llegan hasta que se entregan.",
  // Solo si Google pide comprobar que el dominio es tuyo (Google Search Console).
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
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