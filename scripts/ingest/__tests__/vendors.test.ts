import { urlForHandle } from 'scripts/ingest/vendors';
import { describe, expect, it } from 'vitest';

describe('urlForHandle', () => {
  it('builds a product url without a variant', () => {
    expect(urlForHandle('test-gear', 'WCP')).toBe(
      'https://wcproducts.com/products/test-gear',
    );
  });

  it('appends the Shopify variant query param', () => {
    expect(urlForHandle('test-gear', 'WCP', 12345)).toBe(
      'https://wcproducts.com/products/test-gear?variant=12345',
    );
  });

  it('omits the query param when variantId is null', () => {
    expect(urlForHandle('test-gear', 'WCP', null)).toBe(
      'https://wcproducts.com/products/test-gear',
    );
  });
});
