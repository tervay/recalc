import {
  boreForWheel,
  classifyWheelType,
  isWheelProduct,
  optionValueByName,
  parseDiameterMm,
  parseDurometer,
  skuOrNull,
  wheelNameFromTitle,
} from 'scripts/ingest/parsing/wheels/helpers';
import { urlForHandle } from 'scripts/ingest/vendors';

import type { ShopifyProduct } from '~/lib/types/shopify';
import type { JSONWheel } from '~/lib/types/wheels';

export function parseSwyftWheels(products: ShopifyProduct[]): JSONWheel[] {
  const wheels: JSONWheel[] = [];

  for (const product of products) {
    if (!isWheelProduct(product.title)) continue;

    const type = classifyWheelType(product.title);
    if (type === null) continue;

    const titleDiameter = parseDiameterMm(product.title);

    for (const variant of product.variants) {
      const sizeText = optionValueByName(product, variant, /size|diameter/i);
      const diameter =
        (sizeText === null ? null : parseDiameterMm(sizeText)) ?? titleDiameter;
      if (diameter === null) continue;

      const sku = skuOrNull(variant.sku);

      const bore = boreForWheel(
        'Swyft',
        { sku, handle: product.handle },
        product.title,
        optionValueByName(product, variant, /bore/i) ?? product.title,
      );
      if (bore === null) continue;

      wheels.push({
        name: wheelNameFromTitle(product.title),
        diameter,
        bore,
        type,
        durometer: parseDurometer(
          optionValueByName(product, variant, /durometer/i) ?? product.title,
        ),
        url: urlForHandle(product.handle, 'Swyft'),
        sku,
        vendor: 'Swyft',
      });
    }
  }

  return wheels;
}
