import { fetchWithRetry } from 'scripts/ingest/retrieval/fetchWithRetry';
import * as z from 'zod';

import type { ShopifyProduct, ShopifyVariant } from '~/lib/types/shopify';

// REV publishes a live product feed with none of the pagination/store
// scaffolding Shopify vendors have - just a flat JSON array. Every entry is
// validated against this schema before anything downstream ever sees it, so
// a malformed or unexpectedly-shaped upstream response fails loudly here
// instead of producing bad parts data.
export const REV_FEED_URL =
  'https://dashboard.revrobotics.com/feeds/usa/products.json';

const zREVFeedProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  availability_status: z.string(),
  price: z.number(),
  url: z.string().url(),
  image_url: z.string().optional(),
});
export type REVFeedProduct = z.infer<typeof zREVFeedProductSchema>;

const zREVFeedSchema = z.array(zREVFeedProductSchema);

// REV's feed carries no per-product timestamps; this placeholder fills the
// ShopifyProduct/Variant fields the store-cache and parsers never read.
const EPOCH = '1970-01-01T00:00:00.000Z';

// Deterministic 32-bit FNV-1a hash. Shopify vendors have numeric product/
// variant ids we can track across runs; REV's feed has none, so we derive
// stable synthetic ones from the url/sku so `firstSeen` tracking in the
// store cache (keyed on `${product.id}_${variant.id}`) stays stable across
// pipeline runs instead of re-flagging every REV part as "new" each time.
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// Adapts one validated feed entry into the pipeline's ShopifyProduct shape.
// The full product `url` is stored as the `handle` (REV parsers read it
// back out directly as the part's url, since `urlForHandle` has no REV
// config and REV is intentionally excluded from SHOPIFY_CONFIGS).
export function feedEntryToShopifyProduct(
  entry: REVFeedProduct,
): ShopifyProduct {
  const variant: ShopifyVariant = {
    id: fnv1a(entry.sku),
    title: entry.name,
    option1: null,
    option2: null,
    option3: null,
    sku: entry.sku,
    requires_shipping: true,
    taxable: true,
    featured_image: null,
    available: entry.availability_status.toLowerCase() === 'available',
    price: String(entry.price),
    grams: 0,
    compare_at_price: null,
    position: 1,
    product_id: fnv1a(entry.url),
    created_at: EPOCH,
    updated_at: EPOCH,
  };

  return {
    id: fnv1a(entry.url),
    title: entry.name,
    handle: entry.url,
    body_html: '',
    published_at: EPOCH,
    created_at: EPOCH,
    updated_at: EPOCH,
    vendor: 'REV',
    product_type: '',
    tags: [],
    variants: [variant],
    images: [],
    options: [],
  };
}

export async function fetchREVProducts(): Promise<ShopifyProduct[]> {
  const { response } = await fetchWithRetry(REV_FEED_URL);
  if (response.status !== 200) {
    throw new Error(`Failed to fetch REV feed: HTTP ${response.status}`);
  }

  const raw: unknown = await response.json();
  const entries = zREVFeedSchema.parse(raw);
  return entries.map(feedEntryToShopifyProduct);
}
