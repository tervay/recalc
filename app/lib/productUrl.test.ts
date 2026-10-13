import { describe, expect, it } from 'vitest';

import { withVariant } from '~/lib/productUrl';

describe('withVariant', () => {
  it('appends the Shopify variant query param', () => {
    expect(withVariant('https://wcproducts.com/products/gear', 12345)).toBe(
      'https://wcproducts.com/products/gear?variant=12345',
    );
  });

  it('leaves the url unchanged when variantId is null', () => {
    expect(withVariant('https://wcproducts.com/products/gear', null)).toBe(
      'https://wcproducts.com/products/gear',
    );
  });

  it('does not duplicate an existing variant query param', () => {
    expect(
      withVariant('https://wcproducts.com/products/gear?variant=12345', 99999),
    ).toBe('https://wcproducts.com/products/gear?variant=12345');
  });

  it('uses & when the url already has a query string', () => {
    expect(
      withVariant('https://wcproducts.com/products/gear?foo=bar', 12345),
    ).toBe('https://wcproducts.com/products/gear?foo=bar&variant=12345');
  });
});
