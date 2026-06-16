import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Inter } from "next/font/google";

const display = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Khao — order home food",
  description: "Order fresh home-cooked food straight from local kitchens.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#E0922F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
