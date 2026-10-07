# Nikky Luxe Online Payment Setup

The project now supports guest checkout, Paystack hosted payment, server-side payment verification, a signed Paystack webhook, and an Admin > Orders area.

## 1. Apply the Supabase migration first

Open Supabase > SQL Editor and run the contents of:

`supabase/migrations/20260929_add_orders_and_payments.sql`

This creates `orders`, `order_items`, the order number generator, indexes and RLS protection.

## 2. Configure Paystack in test mode

Create/finish the Nikky Luxe Paystack merchant account and get the **test secret key** from the Paystack dashboard.

Add this locally to `.env.local`:

```env
PAYSTACK_SECRET_KEY=sk_test_...
```

Do not add `NEXT_PUBLIC_` to the secret key and do not commit the key to Git.

The storefront uses Paystack's hosted checkout URL, so a Paystack public key is not required by this implementation.

## 3. Local/site URL

For production:

```env
NEXT_PUBLIC_SITE_URL=https://nikky-luxe.vercel.app
```

For Codespaces, keep the current public Codespaces URL while testing there.

## 4. Configure the Paystack webhook

In Paystack, set the webhook URL to:

`https://nikky-luxe.vercel.app/api/paystack/webhook`

The application verifies `x-paystack-signature` with HMAC SHA-512 before accepting a payment event.

## 5. Add the Vercel secret

Vercel > Nikky Luxe > Settings > Environment Variables:

- Name: `PAYSTACK_SECRET_KEY`
- Value: your Paystack test secret key first
- Environment: Production

Redeploy after changing environment variables.

## 6. Test before going live

1. Add a priced product or variant to the bag.
2. Open `/cart`.
3. Continue to `/checkout`.
4. Enter guest contact and delivery information.
5. Pay using Paystack test mode.
6. Confirm the success page displays an `NL-YYYYMMDD-...` order number.
7. Open Admin > Orders and confirm the payment status is `PAID`.
8. Change fulfilment status from Paid to Processing, Shipped and Delivered.
9. Confirm the order total matches the product/variant total. Delivery must remain outside the online total.

Only switch from Paystack test keys to live keys after the full test flow passes.
