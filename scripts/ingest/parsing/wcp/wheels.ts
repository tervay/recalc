import {
  boreForWheel,
  classifyWheelType,
  isWheelProduct,
  parseDiameterMm,
  parseDurometer,
  skuOrNull,
  wheelNameFromTitle,
} from 'scripts/ingest/parsing/wheels/helpers';
import { urlForHandle } from 'scripts/ingest/vendors';

import type { ShopifyProduct } from '~/lib/types/shopify';
import type { JSONWheel } from '~/lib/types/wheels';

export function parseWCPWheels(products: ShopifyProduct[]): JSONWheel[] {
  const wheels: JSONWheel[] = [];

  for (const product of products) {
    if (!isWheelProduct(product.title)) continue;

    const diameter = parseDiameterMm(product.title);
    if (diameter === null) continue;

    const type = classifyWheelType(product.title);
    if (type === null) continue;

    const sku = skuOrNull(product.variants[0].sku);

    const bore = boreForWheel(
      'WCP',
      { sku, handle: product.handle },
      product.title,
      /\(([^)]*)\)/.exec(product.title)?.[1] ?? product.title,
    );
    if (bore === null) continue;

    wheels.push({
      name: wheelNameFromTitle(product.title),
      diameter,
      bore,
      type,
      durometer: parseDurometer(product.title),
      url: urlForHandle(product.handle, 'WCP'),
      sku,
      vendor: 'WCP',
    });
  }

  return wheels;
}
