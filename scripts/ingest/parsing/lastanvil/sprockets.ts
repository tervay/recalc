import { urlForHandle } from 'scripts/ingest/vendors';

import type { JSONSprocket } from '~/lib/types/sprockets';

export function parseLastAnvilSprockets(): JSONSprocket[] {
  return [
    {
      teeth: 12,
      bore: '1/4" Round',
      chainType: '#25',
      url: urlForHandle('idler-sprocket', 'LastAnvil'),
      sku: '250153',
      vendor: 'LastAnvil',
    },
  ];
}
