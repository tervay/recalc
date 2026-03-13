export interface StoreCacheEntry {
  vendor: string;
  product: {
    title: string;
    id: number;
    handle: string;
  };
  variant: {
    id: number;
    title: string;
    sku: string | null;
    options: (string | null)[];
  };
  firstSeen: string; // ISO 8601
}
