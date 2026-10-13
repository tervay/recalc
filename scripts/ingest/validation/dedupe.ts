export function dedupeParts<
  T extends { sku: string | null; vendor: string; variantId: number | null },
>(parts: T[]): T[] {
  const seen = new Set<string>();
  return parts.filter((part) => {
    const { variantId: _, ...specs } = part;
    const key = part.sku ? `${part.vendor}:${part.sku}` : JSON.stringify(specs);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
