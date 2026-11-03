export function dedupeParts<
  T extends {
    sku: string | null;
    vendor: string;
    variantId: number | null;
    url?: string;
  },
>(parts: T[]): T[] {
  const seen = new Set<string>();
  return parts.filter((part) => {
    const { variantId: _, url, ...specs } = part;
    const key = part.sku
      ? `${part.vendor}:${part.sku}`
      : JSON.stringify({ ...specs, url: url?.split('?')[0] });
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
