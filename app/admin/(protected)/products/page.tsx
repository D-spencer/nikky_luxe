import Link from "next/link";
import Image from "next/image";
import { Pencil, Plus } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatNaira } from "@/lib/currency";
import type { Product } from "@/lib/types";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import { cloudinaryImageUrl, cloudinaryVideoUrl } from "@/lib/cloudinary-delivery";

export default async function AdminProductsPage() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("products").select("*, category:categories(*), product_media(*)").order("created_at", { ascending: false });
  const products = (data || []) as Product[];

  return (
    <main className="admin-content">
      <div className="admin-page-heading"><div><span>Catalogue</span><h1>Products</h1><p>Upload, edit and organise what customers see.</p></div><Link href="/admin/products/new" className="button button-dark"><Plus size={17} /> Add Product</Link></div>
      <div className="admin-table-card">
        {products.length === 0 ? <div className="admin-empty"><PackageEmpty /><h3>No products yet</h3><p>Add your first Nikky Luxe product.</p></div> : (
          <div className="admin-product-list">
            {products.map((product) => {
              const first = [...(product.product_media || [])].sort((a,b) => a.display_order-b.display_order)[0];
              return <div className="admin-product-row" key={product.id}>
                <div className="admin-thumb">{first?.media_type === "image" ? <Image src={cloudinaryImageUrl(first.url, 160)} alt="" fill sizes="70px" unoptimized /> : first?.media_type === "video" ? <video src={cloudinaryVideoUrl(first.url, 480)} preload="metadata" muted playsInline /> : <span>NL</span>}</div>
                <div className="admin-product-name"><strong>{product.name}</strong><span>{product.category?.name || "Uncategorised"}</span></div>
                <div><strong>{formatNaira(product.price)}</strong></div>
                <div><span className={`status-pill ${product.available ? "live" : "off"}`}>{product.available ? "Available" : "Hidden"}</span></div>
                <div><span className={`status-pill ${product.featured ? "featured" : ""}`}>{product.featured ? "Featured" : "Standard"}</span></div>
                <div className="row-actions"><Link href={`/admin/products/${product.id}/edit`} className="icon-button" title="Edit"><Pencil size={17} /></Link><DeleteProductButton id={product.id} name={product.name} /></div>
              </div>;
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function PackageEmpty() { return <div className="empty-monogram small">NL</div>; }
