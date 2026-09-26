"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import type { Category } from "@/lib/types";

export default function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true);
    const form = new FormData(e.currentTarget);
    const payload = { name: form.get("name"), description: form.get("description"), display_order: Number(form.get("display_order") || 0) };
    const res = await fetch(editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setBusy(false);
    if (!res.ok) return alert("Could not save category.");
    setEditing(null); (e.currentTarget as HTMLFormElement).reset(); router.refresh();
  }

  async function remove(category: Category) {
    if (!confirm(`Delete ${category.name}? Products in this category must be moved or deleted first.`)) return;
    const res = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
    if (!res.ok) return alert("This category could not be deleted. It may still contain products.");
    router.refresh();
  }

  return <div className="category-manager-grid">
    <form className="admin-form-card compact" onSubmit={submit} key={editing?.id || "new"}>
      <div className="form-title-row"><h2>{editing ? "Edit category" : "Add category"}</h2>{editing && <button type="button" className="icon-button" onClick={() => setEditing(null)}><X size={17} /></button>}</div>
      <label>Category name<input name="name" required defaultValue={editing?.name || ""} placeholder="e.g. Earrings" /></label>
      <label>Description<textarea name="description" rows={4} defaultValue={editing?.description || ""} placeholder="Optional short description" /></label>
      <label>Display order<input name="display_order" type="number" min="0" defaultValue={editing?.display_order ?? categories.length + 1} /></label>
      <button className="button button-dark wide" disabled={busy} type="submit">{editing ? "Save category" : <><Plus size={16} /> Add category</>}</button>
    </form>

    <div className="admin-table-card category-list">
      {categories.map((category) => <div className="category-list-row" key={category.id}><div><strong>{category.name}</strong><span>/{category.slug}</span></div><div className="row-actions"><button className="icon-button" onClick={() => setEditing(category)}><Pencil size={16} /></button><button className="icon-button danger" onClick={() => remove(category)}><Trash2 size={16} /></button></div></div>)}
    </div>
  </div>;
}
