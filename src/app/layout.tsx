import type { Metadata } from "next";
import { Dancing_Script, Geist, Montserrat } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Geist: texto general · Montserrat: títulos · Dancing Script: frases decorativas.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
  weight: ["600"],
});

export const metadata: Metadata = {
  title: "OmniMarket · De la caja a la puerta",
  description: "Sigue tus ventas y tus pedidos de OmniMarket, desde que llegan hasta que se entregan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${montserrat.variable} ${dancingScript.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}