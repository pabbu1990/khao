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
  metadataBase: new URL("https://thekhao.com"),
  title: { default: "Khao — online ordering for home kitchens", template: "%s · Khao" },
  description: "Khao gives Ottawa home kitchens and cloud kitchens their own online ordering page to share on WhatsApp — no commission, and no app for customers to install.",
  keywords: ["Khao", "Ottawa home food", "tiffin Ottawa", "home kitchen ordering", "cloud kitchen", "Indian home food Ottawa", "WhatsApp ordering"],
  applicationName: "Khao",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://thekhao.com" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Khao — order home food",
    description: "Your own online ordering page for your home kitchen — share it on WhatsApp, take orders with no commission.",
    url: "https://thekhao.com",
    siteName: "Khao",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Khao — order home food",
    description: "Your own online ordering page for your home kitchen — share it on WhatsApp, take orders with no commission.",
  },
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
