/**
 * Append Shopify's `?variant=` query param so product links open the correct
 * COTS SKU instead of the product family's default variant.
 */
export function withVariant(
  url: string,
  variantId: number | null | undefined,
): string {
  if (variantId == null) return url;
  if (/(?:^|[?&])variant=/.test(url)) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}variant=${variantId}`;
}
