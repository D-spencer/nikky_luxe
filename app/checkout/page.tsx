import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="subpage-main"><section className="section checkout-page"><div className="container"><CheckoutForm /></div></section></main>
      <Footer />
    </>
  );
}
