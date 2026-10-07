# Nikky Luxe Special Offers

## Database setup
Run `supabase/migrations/20261004_add_special_offers.sql` in the Supabase SQL Editor before using the Offers controls.

The migration adds `offer_price`, `on_offer`, `offer_starts_at`, and `offer_ends_at` to products and an index for active offers.

## Behaviour
- Admin can enable an offer, set the offer price, and optionally schedule start/end times.
- `/offers` shows only available products whose offers are currently active.
- Product cards and product details show the active offer price and crossed-out regular price.
- Checkout recalculates the offer server-side; browser prices are not trusted.
- If a selected variant has its own price override, that variant price takes precedence, matching the existing Effshorl implementation.
