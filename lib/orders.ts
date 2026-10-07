import { createAdminClient } from "@/lib/supabase/admin";
import type { PaystackTransactionData } from "@/lib/paystack";

export async function markOrderPaidFromPaystack(transaction: PaystackTransactionData) {
  if (!transaction.reference) throw new Error("Missing payment reference.");

  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("payment_reference", transaction.reference)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!order) throw new Error("Order not found for this payment.");

  const expectedAmount = Math.round(Number(order.total) * 100);
  if (transaction.status !== "success") throw new Error("Payment has not been completed.");
  if (transaction.currency !== "NGN") throw new Error("Payment currency does not match the order.");
  if (Number(transaction.amount) !== expectedAmount) throw new Error("Payment amount does not match the order total.");

  const transactionEmail = transaction.customer?.email?.trim().toLowerCase();
  if (transactionEmail && transactionEmail !== String(order.customer_email).trim().toLowerCase()) {
    throw new Error("Payment customer does not match the order.");
  }

  const transactionId = transaction.id ? String(transaction.id) : null;
  if (order.payment_status === "paid") {
    if (order.paystack_transaction_id && transactionId && order.paystack_transaction_id !== transactionId) {
      throw new Error("Order is already linked to another transaction.");
    }
    return order;
  }

  if (transactionId) {
    const { data: existingTransaction } = await supabase
      .from("orders")
      .select("id")
      .eq("paystack_transaction_id", transactionId)
      .neq("id", order.id)
      .limit(1)
      .maybeSingle();
    if (existingTransaction) throw new Error("Transaction is already linked to another order.");
  }

  const { data: updated, error: updateError } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      order_status: order.order_status === "pending_payment" ? "paid" : order.order_status,
      paystack_transaction_id: transactionId,
      paid_at: transaction.paid_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .neq("payment_status", "paid")
    .select("*")
    .maybeSingle();

  if (updateError) throw new Error(updateError.message);
  if (updated) return updated;

  const { data: refreshed, error: refreshError } = await supabase.from("orders").select("*").eq("id", order.id).single();
  if (refreshError || !refreshed) throw new Error(refreshError?.message || "Unable to refresh order.");
  return refreshed;
}
