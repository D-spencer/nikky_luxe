"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Category } from "@/lib/types";
import { cloudinaryImageUrl } from "@/lib/cloudinary-delivery";
import { formatFileSize, IMAGE_INPUT_ACCEPT, prepareImageFile, type PreparedMediaFile } from "@/lib/client-media";

type CategoryImage = { url: string; public_id: string } | null;

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Category | null>(null);
  const [image, setImage] = useState<CategoryImage>(null);
  const [imageFile, setImageFile] = useState<PreparedMediaFile | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setImage(editing?.image_url && editing?.image_public_id ? { url: editing.image_url, public_id: editing.image_public_id } : null);
    setImageFile(null);
    setPreviewUrl(null);
  }, [editing]);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  async function uploadCategoryImage(prepared: PreparedMediaFile): Promise<CategoryImage> {
    const file = prepared.file;
    const signRes = await fetch("/api/admin/categories/media/sign", { method: "POST" });
    if (!signRes.ok) throw new Error("Could not prepare the collection image upload.");
    const signed = await signRes.json();

    const body = new FormData();
    body.append("file", file);
    body.append("api_key", signed.apiKey);
    body.append("timestamp", String(signed.timestamp));
    body.append("signature", signed.signature);
    body.append("folder", signed.folder);
    body.append("allowed_formats", signed.allowedFormats);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, { method: "POST", body });
    if (!uploadRes.ok) throw new Error("Could not upload the collection image.");
    const uploaded = await uploadRes.json();
    return { url: uploaded.secure_url, public_id: uploaded.public_id };
  }

  async function cleanupUpload(publicId: string) {
    await fetch(`/api/admin/media?public_id=${encodeURIComponent(publicId)}&type=image`, { method: "DELETE" }).catch(() => undefined);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    if (optimizing) return;
    setBusy(true);
    let newlyUploaded: CategoryImage = null;

    try {
      const form = new FormData(formElement);
      newlyUploaded = imageFile ? await uploadCategoryImage(imageFile) : null;
      const finalImage = newlyUploaded || image;

      const payload = {
        name: String(form.get("name") || ""),
        description: String(form.get("description") || ""),
        display_order: Number(form.get("display_order") || 0),
        image_url: finalImage?.url || null,
        image_public_id: finalImage?.public_id || null,
      };

      const res = await fetch(editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        if (newlyUploaded?.public_id) await cleanupUpload(newlyUploaded.public_id);
        alert(result.error || "Could not save category.");
        return;
      }

      setEditing(null);
      setImage(null);
      setImageFile(null);
      setPreviewUrl(null);
      formElement.reset();
      router.refresh();
    } catch (error) {
      if (newlyUploaded?.public_id) await cleanupUpload(newlyUploaded.public_id);
      console.error("Category save error:", error);
      alert(error instanceof Error ? error.message : "Something went wrong while saving the category.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(category: Category) {
    if (!confirm(`Delete ${category.name}? Products in this category must be moved or deleted first.`)) return;
    const res = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
    if (!res.ok) return alert("This category could not be deleted. It may still contain products.");
    router.refresh();
  }

  function startEditing(category: Category) {
    setEditing(category);
  }

  function cancelEditing() {
    setEditing(null);
    setImage(null);
    setImageFile(null);
    setPreviewUrl(null);
  }

  const visiblePreview = previewUrl || image?.url || null;

  return <div className="category-manager-grid">
    <form className="admin-form-card compact" onSubmit={submit} key={editing?.id || "new"}>
      <div className="form-title-row"><h2>{editing ? "Edit category" : "Add category"}</h2>{editing && <button type="button" className="icon-button" onClick={cancelEditing} aria-label="Cancel editing"><X size={17} /></button>}</div>
      <label>Category name<input name="name" required maxLength={80} defaultValue={editing?.name || ""} placeholder="e.g. Earrings" /></label>
      <label>Description<textarea name="description" maxLength={500} rows={4} defaultValue={editing?.description || ""} placeholder="Optional short description" /></label>
      <label>Display order<input name="display_order" type="number" min="0" defaultValue={editing?.display_order ?? categories.length + 1} /></label>

      <div className="category-image-manager">
        <div><strong>Collection image</strong><p>Optional. If no image is added, the classic Nikky Luxe collection card is used.</p></div>
        {visiblePreview ? (
          <div className="category-image-preview">
            <img src={cloudinaryImageUrl(visiblePreview, 700)} alt="Collection preview" />
            <button type="button" className="icon-button danger category-image-remove" onClick={() => { setImage(null); setImageFile(null); setPreviewUrl(null); }} aria-label="Remove collection image"><X size={16} /></button>
          </div>
        ) : (
          <label className="upload-zone category-upload-zone"><ImagePlus size={25} /><strong>{optimizing ? "Optimizing image..." : "Choose collection image"}</strong><span>Automatically resized and compressed in this browser before Cloudinary upload · JPG, PNG or WEBP</span><input type="file" accept={IMAGE_INPUT_ACCEPT} disabled={optimizing} onChange={async e=>{const file=e.target.files?.[0]; e.target.value=""; if(!file)return; setOptimizing(true); try{setImageFile(await prepareImageFile(file));}catch(err){alert(err instanceof Error?err.message:"Could not optimize this image.");}finally{setOptimizing(false);}}} /></label>
        )}
        {imageFile && <div className="image-optimization-note"><strong>{imageFile.optimized ? "Optimized before upload" : "Ready to upload"}</strong><span>{imageFile.optimized ? `${formatFileSize(imageFile.originalSize)} → ${formatFileSize(imageFile.file.size)}` : formatFileSize(imageFile.file.size)}</span></div>}{visiblePreview && <label className="button button-light category-replace-button"><ImagePlus size={15} /> {optimizing ? "Optimizing..." : "Replace image"}<input type="file" accept={IMAGE_INPUT_ACCEPT} hidden disabled={optimizing} onChange={async e=>{const file=e.target.files?.[0]; e.target.value=""; if(!file)return; setOptimizing(true); try{setImageFile(await prepareImageFile(file));}catch(err){alert(err instanceof Error?err.message:"Could not optimize this image.");}finally{setOptimizing(false);}}} /></label>}
      </div>

      <button className="button button-dark wide" disabled={busy || optimizing} type="submit">{busy ? <><Loader2 size={16} className="spin" /> Saving...</> : editing ? "Save category" : <><Plus size={16} /> Add category</>}</button>
    </form>

    <div className="admin-table-card category-list">
      {categories.map((category) => <div className="category-list-row" key={category.id}>
        <div className="category-list-info">{category.image_url ? <img className="category-list-thumb" src={cloudinaryImageUrl(category.image_url, 160)} alt="" /> : <span className="category-list-thumb category-list-thumb-empty"><ImagePlus size={15} /></span>}<div><strong>{category.name}</strong><span>/{category.slug}</span></div></div>
        <div className="row-actions"><button className="icon-button" onClick={() => startEditing(category)} aria-label={`Edit ${category.name}`}><Pencil size={16} /></button><button className="icon-button danger" onClick={() => remove(category)} aria-label={`Delete ${category.name}`}><Trash2 size={16} /></button></div>
      </div>)}
    </div>
  </div>;
}
