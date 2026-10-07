import type { Metadata } from "next";
import CartPageContent from "@/components/CartPageContent";

export const metadata: Metadata = { title: "Shopping bag", robots: { index: false, follow: false } };

export default function CartPage() {
  return <CartPageContent />;
}
