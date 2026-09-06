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
import type { JSONWheel, WheelBore } from '~/lib/types/wheels';

const THRIFTY_DEFAULT_BORE: WheelBore = '1/2" Hex';

export function parseThriftyWheels(products: ShopifyProduct[]): JSONWheel[] {
  const wheels: JSONWheel[] = [];

  for (const product of products) {
    if (!isWheelProduct(product.title)) continue;

    const diameter = parseDiameterMm(product.title);
    if (diameter === null) continue;

    const type = classifyWheelType(product.title);
    if (type === null) continue;

    for (const variant of product.variants) {
      const sku = skuOrNull(variant.sku);

      const bore = boreForWheel(
        'Thrifty',
        { sku, handle: product.handle },
        product.title,
        optionValueByName(product, variant, /bore/i) ?? product.title,
        THRIFTY_DEFAULT_BORE,
      );
      if (bore === null) continue;

      wheels.push({
        name: wheelNameFromTitle(product.title),
        diameter,
        bore,
        type,
        durometer: parseDurometer(product.title),
        url: urlForHandle(product.handle, 'Thrifty'),
        sku,
        vendor: 'Thrifty',
      });
    }
  }

  return wheels;
}
