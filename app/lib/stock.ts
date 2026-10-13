import * as z from 'zod';

import type { Vendor } from '~/lib/types/common';

export const SHOPIFY_DOMAINS = {
  WCP: 'https://wcproducts.com',
  Swyft: 'https://shop.swyftrobotics.com',
  Thrifty: 'https://www.thethriftybot.com',
  VBeltGuys: 'https://www.vbeltguys.com',
  AndyMark: 'https://www.andymark.com',
  LastAnvil: 'https://www.lastanvil.com',
  SDS: 'https://www.swervedrivespecialties.com',
} as const satisfies Partial<Record<Vendor, string>>;

export type StockStatus = 'in-stock' | 'backorder' | 'out-of-stock' | 'unknown';

export interface StockItem {
  vendor: string;
  variantId: number | null;
  sku: string | null;
}

export const REV_FEED_URL =
  'https://dashboard.revrobotics.com/feeds/usa/products.json';

const STOREFRONT_API_VERSION = '2026-10';
const MAX_IDS_PER_REQUEST = 250;
const STOCK_QUERY = `query Stock($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on ProductVariant { availableForSale currentlyNotInStock }
  }
}`;

const zStockResponseSchema = z.object({
  data: z.object({
    nodes: z.array(
      z
        .object({
          availableForSale: z.boolean(),
          currentlyNotInStock: z.boolean(),
        })
        .nullable(),
    ),
  }),
});
type VariantNode = z.infer<
  typeof zStockResponseSchema
>['data']['nodes'][number];

const zRevFeedSchema = z.array(
  z.object({ sku: z.string(), availability_status: z.string() }),
);

const REV_AVAILABILITY: Partial<Record<string, StockStatus>> = {
  Available: 'in-stock',
  'Out of Stock': 'out-of-stock',
};

const domainByVendor = new Map<string, string>(Object.entries(SHOPIFY_DOMAINS));
const cache = new Map<string, Promise<StockStatus>>();
let revFeed: Promise<Map<string, StockStatus> | null> | null = null;

export function stockKey(item: StockItem): string {
  return `${item.vendor}:${item.variantId ?? item.sku}`;
}

export function isUnavailable(status: StockStatus | undefined): boolean {
  return status === 'backorder' || status === 'out-of-stock';
}

function toStockStatus(node: VariantNode | undefined): StockStatus {
  if (!node) return 'unknown';
  if (!node.availableForSale) return 'out-of-stock';
  if (node.currentlyNotInStock) return 'backorder';
  return 'in-stock';
}

async function queryStock(
  domain: string,
  variantIds: number[],
): Promise<StockStatus[] | null> {
  try {
    const response = await fetch(
      `${domain}/api/${STOREFRONT_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: STOCK_QUERY,
          variables: {
            ids: variantIds.map((id) => `gid://shopify/ProductVariant/${id}`),
          },
        }),
      },
    );
    if (!response.ok) return null;
    const { nodes } = zStockResponseSchema.parse(await response.json()).data;
    if (nodes.length !== variantIds.length) return null;
    return nodes.map(toStockStatus);
  } catch {
    return null;
  }
}

async function queryRevFeed(): Promise<Map<string, StockStatus> | null> {
  try {
    const response = await fetch(REV_FEED_URL);
    if (!response.ok) return null;
    const feed = zRevFeedSchema.parse(await response.json());
    return new Map(
      feed.map(({ sku, availability_status }) => [
        sku,
        REV_AVAILABILITY[availability_status] ?? 'unknown',
      ]),
    );
  } catch {
    return null;
  }
}

function requestRevStock(key: string, sku: string): void {
  revFeed ??= queryRevFeed().then((feed) => {
    if (feed === null) revFeed = null;
    return feed;
  });
  cache.set(
    key,
    revFeed.then((feed) => {
      if (feed === null) cache.delete(key);
      return feed?.get(sku) ?? 'unknown';
    }),
  );
}

interface PendingVariant {
  key: string;
  variantId: number;
}

function requestStock(domain: string, variants: PendingVariant[]): void {
  const statuses = queryStock(
    domain,
    variants.map(({ variantId }) => variantId),
  );
  variants.forEach(({ key }, i) => {
    cache.set(
      key,
      statuses.then((result) => {
        if (result === null) cache.delete(key);
        return result?.[i] ?? 'unknown';
      }),
    );
  });
}

export async function fetchStock(
  items: readonly StockItem[],
): Promise<Map<string, StockStatus>> {
  const unique = new Map(items.map((item) => [stockKey(item), item]));

  const pendingByDomain = new Map<string, PendingVariant[]>();
  for (const [key, { vendor, variantId, sku }] of unique) {
    if (cache.has(key)) continue;
    if (vendor === 'REV' && sku !== null) {
      requestRevStock(key, sku);
      continue;
    }
    const domain = domainByVendor.get(vendor);
    if (variantId === null || !domain) continue;
    pendingByDomain.set(domain, [
      ...(pendingByDomain.get(domain) ?? []),
      { key, variantId },
    ]);
  }

  for (const [domain, pending] of pendingByDomain) {
    for (let i = 0; i < pending.length; i += MAX_IDS_PER_REQUEST) {
      requestStock(domain, pending.slice(i, i + MAX_IDS_PER_REQUEST));
    }
  }

  const keys = [...unique.keys()];
  const statuses = await Promise.all(
    keys.map(
      (key) => cache.get(key) ?? Promise.resolve<StockStatus>('unknown'),
    ),
  );
  return new Map(keys.map((key, i) => [key, statuses[i]]));
}
