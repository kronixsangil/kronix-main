import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kronix.co"),
  title: "KroniX | Tecnología local que mueve tu ciudad",
  description: "KroniX conecta personas, trabajadores y negocios en San Gil y Granada. Servicios locales, entregas, establecimientos y viajes compartidos.",
  keywords: ["KroniX", "servicios locales", "domicilios", "San Gil", "Granada Meta", "Ruta KroniX", "KroniX Pro"],
  openGraph: {
    title: "KroniX | Tu ciudad, tus oportunidades, una sola red",
    description: "Tecnología local para conectar personas, trabajadores, negocios y ciudades.",
    url: "https://kronix.co",
    siteName: "KroniX",
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KroniX | Tecnología local que mueve tu ciudad",
    description: "Servicios, oportunidades, establecimientos y viajes compartidos en una sola red.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
