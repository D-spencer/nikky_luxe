"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export default function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function remove() {
    if (!confirm(`Delete ${name}? This also removes its uploaded media.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return alert("Could not delete this product.");
    router.refresh();
  }
  return <button className="icon-button danger" onClick={remove} disabled={busy} title="Delete product"><Trash2 size={17} /></button>;
}
