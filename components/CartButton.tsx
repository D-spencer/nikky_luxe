"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/CartProvider";

export default function CartButton() {
  const { itemCount } = useCart();

  return (
    <Link href="/cart" className="nav-cart" aria-label={`Shopping bag with ${itemCount} item${itemCount === 1 ? "" : "s"}`}>
      <ShoppingBag size={18} />
      <span>Bag</span>
      {itemCount > 0 && <strong>{itemCount > 99 ? "99+" : itemCount}</strong>}
    </Link>
  );
}
