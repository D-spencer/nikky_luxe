export function formatNaira(value: number | null | undefined) {
  if (value === null || value === undefined) return "Price on request";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}
