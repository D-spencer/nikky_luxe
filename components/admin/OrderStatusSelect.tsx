"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const paidStatuses = ["paid", "processing", "shipped", "delivered", "cancelled"] as const;

export default function OrderStatusSelect({ id, value, paymentStatus }: { id: string; value: string; paymentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(value);
  const [saving, setSaving] = useState(false);
  const options = paymentStatus === "paid" ? paidStatuses : (["pending_payment", "cancelled"] as const);

  async function update(next: string) {
    const previous = status;
    setStatus(next);
    setSaving(true);
    const response = await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_status: next }),
    });
    setSaving(false);
    if (!response.ok) {
      setStatus(previous);
      alert("Could not update the order status.");
      return;
    }
    router.refresh();
  }

  return (
    <select className="order-status-select" value={status} disabled={saving} onChange={(e) => update(e.target.value)}>
      {options.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase())}</option>)}
    </select>
  );
}
