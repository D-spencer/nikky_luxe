const PAYSTACK_BASE_URL = "https://api.paystack.co";

export type PaystackTransactionData = {
  id?: number | string;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at?: string | null;
  customer?: { email?: string | null };
  metadata?: unknown;
};

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  return key;
}

export async function initializePaystackTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: String(input.amountKobo),
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: JSON.stringify(input.metadata),
    }),
    cache: "no-store",
  });

  const result = await response.json();
  if (!response.ok || !result?.status || !result?.data?.authorization_url) {
    throw new Error(result?.message || "Paystack could not initialize the transaction.");
  }

  return result.data as { authorization_url: string; access_code: string; reference: string };
}

export async function verifyPaystackTransaction(reference: string): Promise<PaystackTransactionData> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok || !result?.status || !result?.data) {
    throw new Error(result?.message || "Unable to verify this payment.");
  }
  return result.data as PaystackTransactionData;
}
