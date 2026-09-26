const rawWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2347063051679";

export const brand = {
  name: "Nikky Luxe",
  tagline: "Luxury Pieces for Every Moment",
  whatsapp: rawWhatsApp.replace(/\D/g, ""),
  phoneDisplay: "+234 706 305 1679",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || "house_ofnikkyjewelries",
  address: "Sam Marian Plaza, Ikola Road, Ipaja, Lagos — Shops 16 & 17",
};

export function whatsappLink(message = "Hello Nikky Luxe, I would like to make an enquiry.") {
  return `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message)}`;
}
