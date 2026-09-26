import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600", "700"] });
const sans = Manrope({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Nikky Luxe | Premium Jewelry & Accessories", template: "%s | Nikky Luxe" },
  description: "Shop timeless jewelry and accessories from Nikky Luxe — bangles, bracelets, necklaces, wristwatches, sunglasses, luxury chains and wristbands.",
  openGraph: {
    title: "Nikky Luxe",
    description: "Luxury Pieces for Every Moment",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
