import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://nikky-luxe.vercel.app";
const shareImage = `${siteUrl.replace(/\/$/, "")}/og-image.jpg?v=20261005`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Nikky Luxe | Premium Jewelry & Accessories",
    template: "%s | Nikky Luxe",
  },

  description:
    "Shop timeless jewelry and accessories from Nikky Luxe — bangles, bracelets, necklaces, wristwatches, sunglasses, luxury chains and wristbands.",

  applicationName: "Nikky Luxe",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Nikky Luxe | Premium Jewelry & Accessories",
    description: "Luxury Pieces for Every Moment",
    type: "website",
    siteName: "Nikky Luxe",
    url: siteUrl,
    images: [
      {
        url: shareImage,
        width: 1200,
        height: 630,
        alt: "Nikky Luxe — Premium Jewelry and Accessories",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Nikky Luxe",
    description: "Luxury Pieces for Every Moment",
    images: [shareImage],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fffaf6",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();

  return (
    <html lang="en">
      <body><CartProvider>{children}</CartProvider></body>
    </html>
  );
}