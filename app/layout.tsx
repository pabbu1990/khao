import "./globals.css";
import type { Metadata, Viewport } from "next";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
