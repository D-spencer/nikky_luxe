"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import type { Category, Product, ProductMedia, ProductVariantMedia } from "@/lib/types";
import { cloudinaryImageUrl, cloudinaryVideoUrl } from "@/lib/cloudinary-delivery";
import { formatFileSize, MEDIA_INPUT_ACCEPT, prepareMediaFiles, type PreparedMediaFile } from "@/lib/client-media";

type Props = { categories: Category[]; product?: Product | null };
type UploadedMedia = Pick<ProductMedia, "url" | "public_id" | "media_type" | "display_order"> & { id?: string };
type VariantDraft = { id?: string; name: string; price: string; available: boolean; media: (Pick<ProductVariantMedia, "url" | "public_id" | "media_type" | "display_order"> & { id?: string })[]; files: PreparedMediaFile[] };
const localDateTime = (value?: string | null) => value ? new Date(value).toISOString().slice(0,16) : "";

const COMMON_TYPES = ["Colour", "Size", "Material", "Style", "Finish", "Length", "Design"];

export default function ProductForm({ categories, product }: Props) {
  const router = useRouter();
  const existing = useMemo<UploadedMedia[]>(() => [...(product?.product_media || [])].sort((a,b) => a.display_order-b.display_order), [product]);
  const initialVariants = useMemo<VariantDraft[]>(() => [...(product?.product_variants || [])].sort((a,b) => a.display_order-b.display_order).map(v => ({ id:v.id, name:v.name, price:v.price == null ? "" : String(v.price), available:v.available, media:[...(v.product_variant_media || [])].sort((a,b)=>a.display_order-b.display_order), files:[] })), [product]);
  const initialType = product?.variant_type || "Colour";
  const [media, setMedia] = useState<UploadedMedia[]>(existing);
  const [files, setFiles] = useState<PreparedMediaFile[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [hasVariants, setHasVariants] = useState(initialVariants.length > 0 || !!product?.variant_type);
  const [variantTypeChoice, setVariantTypeChoice] = useState(COMMON_TYPES.includes(initialType) ? initialType : "Custom");
  const [customVariantType, setCustomVariantType] = useState(COMMON_TYPES.includes(initialType) ? "" : initialType);
  const [variants, setVariants] = useState<VariantDraft[]>(initialVariants.length ? initialVariants : []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function uploadFiles(selected: PreparedMediaFile[], startingAt = 0) {
    const uploaded: UploadedMedia[] = [];
    for (const prepared of selected) {
      const file = prepared.file;
      const resourceType = file.type.startsWith("video/") ? "video" : "image";
      const signRes = await fetch("/api/admin/media/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceType }),
      });
      if (!signRes.ok) throw new Error("Could not prepare media upload.");
      const signed = await signRes.json();
      if (signed.resourceType !== resourceType || typeof signed.allowedFormats !== "string") {
        throw new Error("Could not validate media upload.");
      }
      const body = new FormData();
      body.append("file", file);
      body.append("api_key", signed.apiKey);
      body.append("timestamp", String(signed.timestamp));
      body.append("signature", signed.signature);
      body.append("folder", signed.folder);
      body.append("allowed_formats", signed.allowedFormats);
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/${resourceType}/upload`, { method: "POST", body });
      if (!uploadRes.ok) throw new Error(`Could not upload ${file.name}.`);
      const item = await uploadRes.json();
      uploaded.push({ url:item.secure_url, public_id:item.public_id, media_type:item.resource_type === "video" ? "video" : "image", display_order:startingAt + uploaded.length });
    }
    return uploaded;
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (optimizing) { setError("Please wait for image optimization to finish."); return; }
    setBusy(true); setError("");
    try {
      const form = new FormData(e.currentTarget);
      const uploaded = [...media, ...(await uploadFiles(files, media.length))];
      const variantType = hasVariants ? (variantTypeChoice === "Custom" ? customVariantType.trim() : variantTypeChoice) : null;
      if (hasVariants && !variantType) throw new Error("Enter a variant type.");
      if (hasVariants && !variants.length) throw new Error("Add at least one variant.");

      const preparedVariants = [];
      for (let i=0; i<variants.length; i++) {
        const v = variants[i];
        if (!v.name.trim()) throw new Error(`Enter a name for variant ${i + 1}.`);
        const variantUploaded = [...v.media, ...(await uploadFiles(v.files, v.media.length))];
        preparedVariants.push({ id:v.id, name:v.name.trim(), price:v.price === "" ? null : Number(v.price), available:v.available, display_order:i, media:variantUploaded.map((m,j)=>({...m,display_order:j})) });
      }

      const payload = { name:String(form.get("name") || ""), description:String(form.get("description") || ""), price:form.get("price") ? Number(form.get("price")) : null, offer_price:form.get("offer_price") ? Number(form.get("offer_price")) : null, on_offer:form.get("on_offer") === "on", offer_starts_at:form.get("offer_starts_at") ? new Date(String(form.get("offer_starts_at"))).toISOString() : null, offer_ends_at:form.get("offer_ends_at") ? new Date(String(form.get("offer_ends_at"))).toISOString() : null, category_id:String(form.get("category_id") || ""), featured:form.get("featured") === "on", available:form.get("available") === "on", variant_type:variantType, media:uploaded.map((m,i)=>({...m,display_order:i})), variants:hasVariants ? preparedVariants : [] };
      const endpoint = product ? `/api/admin/products/${product.id}` : "/api/admin/products";
      const res = await fetch(endpoint, { method:product ? "PATCH" : "POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).error || "Could not save product.");
      router.push("/admin/products"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); setBusy(false); }
  }

  function updateVariant(index:number, patch:Partial<VariantDraft>) { setVariants(current => current.map((v,i)=>i===index ? {...v,...patch} : v)); }
  function removeExisting(item: UploadedMedia) { if (confirm("Remove this media file? The change is applied when you save.")) setMedia(current=>current.filter(m=>m.public_id!==item.public_id)); }

  return <form className="admin-form-card" onSubmit={submit}>
    {error && <div className="error-box">{error}</div>}
    <div className="form-grid two"><label>Product name<input name="name" required maxLength={120} defaultValue={product?.name || ""} placeholder="e.g. Gold Tennis Bracelet" /></label><label>Category<select name="category_id" required defaultValue={product?.category_id || ""}><option value="" disabled>Select category</option>{categories.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label></div>
    <div className="form-grid two"><label>Base price (₦)<input name="price" type="number" min="0" step="1" defaultValue={product?.price ?? ""} placeholder="Leave blank for price on request" /></label><div className="toggle-group"><label className="check-label"><input name="available" type="checkbox" defaultChecked={product?.available ?? true} /> Available on website</label><label className="check-label"><input name="featured" type="checkbox" defaultChecked={product?.featured ?? false} /> Feature on homepage</label></div></div>
    <label>Description<textarea name="description" maxLength={2000} rows={5} defaultValue={product?.description || ""} placeholder="Short product description, material, style or important details." /></label>
    <div className="offer-admin-box"><div><h3>Special offer</h3><p>Turn this on to show the product on the dedicated Offers page. Dates are optional.</p></div><label className="check-label"><input name="on_offer" type="checkbox" defaultChecked={product?.on_offer ?? false}/> Put this product on special offer</label><div className="form-grid three"><label>Offer price (₦)<input name="offer_price" type="number" min="0" step="1" defaultValue={product?.offer_price ?? ""} placeholder="e.g. 38000"/></label><label>Offer starts<input name="offer_starts_at" type="datetime-local" defaultValue={localDateTime(product?.offer_starts_at)}/></label><label>Offer ends<input name="offer_ends_at" type="datetime-local" defaultValue={localDateTime(product?.offer_ends_at)}/></label></div></div>


    <div className="media-manager"><div><h3>General photos & videos</h3><p>Select several files at once. The first item is the main catalogue image.</p></div><label className="upload-zone"><ImagePlus size={26}/><strong>{optimizing ? "Optimizing images..." : "Choose photos or videos"}</strong><span>Photos are automatically resized and compressed in this browser before Cloudinary upload · Videos are unchanged · JPG, JPEG, PNG, WEBP, MP4, MOV or WEBM</span><input type="file" multiple accept={MEDIA_INPUT_ACCEPT} disabled={optimizing} onChange={async e=>{const selected=Array.from(e.target.files||[]); e.target.value=""; if(!selected.length)return; setOptimizing(true); setError(""); try{const preparedFiles=await prepareMediaFiles(selected); setFiles(current=>[...current,...preparedFiles]);}catch(err){setError(err instanceof Error?err.message:"Could not optimize the selected media.");}finally{setOptimizing(false);}}}/></label>{(media.length>0||files.length>0)&&<div className="media-preview-grid">{media.map(item=><div className="media-preview" key={item.public_id}>{item.media_type==="image"?<img src={cloudinaryImageUrl(item.url, 480)} alt=""/>:<video src={cloudinaryVideoUrl(item.url, 640)} muted playsInline preload="metadata"/>}<button type="button" onClick={()=>removeExisting(item)}><X size={14}/></button></div>)}{files.map((prepared,i)=><div className="media-preview pending" key={`${prepared.originalName}-${i}`}><span>{prepared.file.type.startsWith("video")?"Video":prepared.optimized?"Optimized image":"Image"}</span><small>{prepared.originalName}</small><small className="media-size-note">{prepared.optimized?`${formatFileSize(prepared.originalSize)} → ${formatFileSize(prepared.file.size)}`:formatFileSize(prepared.file.size)}</small><button type="button" onClick={()=>setFiles(c=>c.filter((_,x)=>x!==i))}><X size={14}/></button></div>)}</div>}</div>

    <div className="variant-manager">
      <label className="check-label variant-enable"><input type="checkbox" checked={hasVariants} onChange={e=>setHasVariants(e.target.checked)}/> This product has variants</label>
      {hasVariants && <><div className="variant-type-grid"><label>Variant type<select value={variantTypeChoice} onChange={e=>setVariantTypeChoice(e.target.value)}>{COMMON_TYPES.map(t=><option key={t}>{t}</option>)}<option value="Custom">Other / Custom</option></select></label>{variantTypeChoice==="Custom"&&<label>Custom variant type<input maxLength={50} value={customVariantType} onChange={e=>setCustomVariantType(e.target.value)} placeholder="e.g. Dial colour, Stone type, Chain length"/></label>}</div>
      <div className="variant-list">{variants.map((v,index)=><div className="variant-card" key={v.id || index}><div className="variant-card-head"><strong>Variant {index+1}</strong><button type="button" className="icon-button danger" onClick={()=>setVariants(c=>c.filter((_,i)=>i!==index))}><Trash2 size={16}/></button></div><div className="form-grid two"><label>Option name<input maxLength={100} value={v.name} onChange={e=>updateVariant(index,{name:e.target.value})} placeholder="e.g. Gold, Large, 18 inches"/></label><label>Price override (₦)<input type="number" min="0" step="1" value={v.price} onChange={e=>updateVariant(index,{price:e.target.value})} placeholder="Blank = base price"/></label></div><label className="check-label"><input type="checkbox" checked={v.available} onChange={e=>updateVariant(index,{available:e.target.checked})}/> Available</label><label className="upload-zone variant-upload"><ImagePlus size={20}/><strong>{optimizing ? "Optimizing images..." : "Choose variant images/videos"}</strong><span>Images are automatically optimized before upload · You can select multiple files</span><input type="file" multiple accept={MEDIA_INPUT_ACCEPT} disabled={optimizing} onChange={async e=>{const selected=Array.from(e.target.files||[]); e.target.value=""; if(!selected.length)return; setOptimizing(true); setError(""); try{const preparedFiles=await prepareMediaFiles(selected); updateVariant(index,{files:[...v.files,...preparedFiles]});}catch(err){setError(err instanceof Error?err.message:"Could not optimize the selected media.");}finally{setOptimizing(false);}}}/></label>{(v.media.length>0||v.files.length>0)&&<div className="media-preview-grid">{v.media.map(item=><div className="media-preview" key={item.public_id}>{item.media_type==="image"?<img src={cloudinaryImageUrl(item.url, 480)} alt=""/>:<video src={cloudinaryVideoUrl(item.url, 640)} muted playsInline preload="metadata"/>}<button type="button" onClick={()=>updateVariant(index,{media:v.media.filter(m=>m.public_id!==item.public_id)})}><X size={14}/></button></div>)}{v.files.map((prepared,i)=><div className="media-preview pending" key={`${prepared.originalName}-${i}`}><span>{prepared.file.type.startsWith("video")?"Video":prepared.optimized?"Optimized image":"Image"}</span><small>{prepared.originalName}</small><small className="media-size-note">{prepared.optimized?`${formatFileSize(prepared.originalSize)} → ${formatFileSize(prepared.file.size)}`:formatFileSize(prepared.file.size)}</small><button type="button" onClick={()=>updateVariant(index,{files:v.files.filter((_,x)=>x!==i)})}><X size={14}/></button></div>)}</div>}</div>)}</div>
      <button type="button" className="button button-light variant-add" onClick={()=>setVariants(c=>[...c,{name:"",price:"",available:true,media:[],files:[]}])}><Plus size={16}/> Add variant</button></>}
    </div>
    <div className="form-actions"><button type="button" className="button button-light" onClick={()=>router.back()}>Cancel</button><button type="submit" className="button button-dark" disabled={busy || optimizing}>{busy?<><Loader2 size={16} className="spin"/> Saving...</>:product?"Save Changes":"Publish Product"}</button></div>
  </form>;
}
