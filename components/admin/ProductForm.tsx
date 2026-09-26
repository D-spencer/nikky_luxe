"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X } from "lucide-react";
import type { Category, Product, ProductMedia } from "@/lib/types";

type Props = { categories: Category[]; product?: Product | null };

type UploadedMedia = Pick<ProductMedia, "url" | "public_id" | "media_type" | "display_order"> & { id?: string };

export default function ProductForm({ categories, product }: Props) {
  const router = useRouter();
  const existing = useMemo<UploadedMedia[]>(() => [...(product?.product_media || [])].sort((a,b) => a.display_order-b.display_order), [product]);
  const [media, setMedia] = useState<UploadedMedia[]>(existing);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const form = new FormData(e.currentTarget);
      const uploaded = [...media];
      for (const file of files) {
        const signRes = await fetch("/api/admin/media/sign", { method: "POST" });
        if (!signRes.ok) throw new Error("Could not prepare media upload.");
        const signed = await signRes.json();

        const body = new FormData();
        body.append("file", file);
        body.append("api_key", signed.apiKey);
        body.append("timestamp", String(signed.timestamp));
        body.append("signature", signed.signature);
        body.append("folder", signed.folder);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/auto/upload`, { method: "POST", body });
        if (!uploadRes.ok) throw new Error(`Could not upload ${file.name}.`);
        const item = await uploadRes.json();
        uploaded.push({ url: item.secure_url, public_id: item.public_id, media_type: item.resource_type === "video" ? "video" : "image", display_order: uploaded.length });
      }

      const payload = {
        name: String(form.get("name") || ""),
        description: String(form.get("description") || ""),
        price: form.get("price") ? Number(form.get("price")) : null,
        category_id: String(form.get("category_id") || ""),
        featured: form.get("featured") === "on",
        available: form.get("available") === "on",
        media: uploaded.map((m, i) => ({ ...m, display_order: i })),
      };

      const endpoint = product ? `/api/admin/products/${product.id}` : "/api/admin/products";
      const res = await fetch(endpoint, { method: product ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).error || "Could not save product.");
      router.push("/admin/products"); router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  function removeExisting(item: UploadedMedia) {
    if (!confirm("Remove this media file from the product? The change is applied when you save.")) return;
    setMedia((current) => current.filter((m) => m.public_id !== item.public_id));
  }

  return (
    <form className="admin-form-card" onSubmit={submit}>
      {error && <div className="error-box">{error}</div>}
      <div className="form-grid two">
        <label>Product name<input name="name" required defaultValue={product?.name || ""} placeholder="e.g. Gold Tennis Bracelet" /></label>
        <label>Category<select name="category_id" required defaultValue={product?.category_id || ""}><option value="" disabled>Select category</option>{categories.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label>
      </div>
      <div className="form-grid two">
        <label>Price (₦)<input name="price" type="number" min="0" step="1" defaultValue={product?.price ?? ""} placeholder="Leave blank for price on request" /></label>
        <div className="toggle-group">
          <label className="check-label"><input name="available" type="checkbox" defaultChecked={product?.available ?? true} /> Available on website</label>
          <label className="check-label"><input name="featured" type="checkbox" defaultChecked={product?.featured ?? false} /> Feature on homepage</label>
        </div>
      </div>
      <label>Description<textarea name="description" rows={5} defaultValue={product?.description || ""} placeholder="Short product description, material, style or important details." /></label>

      <div className="media-manager">
        <div><h3>Photos & videos</h3><p>Upload clear product images or short videos. The first item becomes the main product image.</p></div>
        <label className="upload-zone"><ImagePlus size={26} /><strong>Choose photos or videos</strong><span>JPG, PNG, WEBP, MP4 or MOV</span><input type="file" multiple accept="image/*,video/*" onChange={(e) => setFiles(Array.from(e.target.files || []))} /></label>
        {(media.length > 0 || files.length > 0) && <div className="media-preview-grid">
          {media.map((item) => <div className="media-preview" key={item.public_id}>{item.media_type === "image" ? <img src={item.url} alt="" /> : <video src={item.url} muted /> }<button type="button" onClick={() => removeExisting(item)}><X size={14} /></button></div>)}
          {files.map((file, i) => <div className="media-preview pending" key={`${file.name}-${i}`}><span>{file.type.startsWith("video") ? "Video" : "Image"}</span><small>{file.name}</small><button type="button" onClick={() => setFiles((current) => current.filter((_, index) => index !== i))}><X size={14} /></button></div>)}
        </div>}
      </div>
      <div className="form-actions"><button type="button" className="button button-light" onClick={() => router.back()}>Cancel</button><button type="submit" className="button button-dark" disabled={busy}>{busy ? <><Loader2 size={16} className="spin" /> Saving...</> : product ? "Save Changes" : "Publish Product"}</button></div>
    </form>
  );
}
