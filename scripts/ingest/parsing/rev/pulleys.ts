import * as z from 'zod';

import Measurement from '~/lib/models/Measurement';
import type { JSONPulley } from '~/lib/types/pulleys';

const zREVPulleyBoreSchema = z.enum(['8mm', '1/2" Hex', 'MAXSpline']);

const zREVPulleySchema = z.object({
  teeth: z.number(),
  width: z.number().min(0.25), // inches
  bore: zREVPulleyBoreSchema,
  sku: z.string(),
  url: z.string().url(),
});

function revPulleyToJsonPulley(
  pulley: z.infer<typeof zREVPulleySchema>,
): JSONPulley {
  return {
    teeth: pulley.teeth,
    width: new Measurement(pulley.width, 'in').to('mm').scalar,
    profile: 'RT25',
    pitch: new Measurement(0.25, 'in').to('mm').scalar,
    sku: pulley.sku,
    url: pulley.url,
    bore: pulley.bore,
    vendor: 'REV',
  };
}

export function parseREVPulleys(): JSONPulley[] {
  const data: {
    teeth: number;
    bore: '8mm' | '1/2" Hex' | 'MAXSpline';
    width: number;
    sku: string;
  }[] = [
    { teeth: 12, bore: '8mm', width: 0.5, sku: 'REV-21-2200' },
    { teeth: 16, bore: '1/2" Hex', width: 0.5, sku: 'REV-21-2205' },
    { teeth: 16, bore: '1/2" Hex', width: 1, sku: 'REV-21-2206' },
    { teeth: 24, bore: 'MAXSpline', width: 0.5, sku: 'REV-21-2224' },
    { teeth: 32, bore: 'MAXSpline', width: 0.5, sku: 'REV-21-2236' },
    { teeth: 40, bore: 'MAXSpline', width: 0.5, sku: 'REV-21-2248' },
    { teeth: 48, bore: 'MAXSpline', width: 0.5, sku: 'REV-21-2260' },
    { teeth: 56, bore: 'MAXSpline', width: 0.5, sku: 'REV-21-2272' },
    { teeth: 64, bore: 'MAXSpline', width: 0.5, sku: 'REV-21-2284' },
  ];

  const pulleys: JSONPulley[] = [];

  for (const item of data) {
    const revPulley = zREVPulleySchema.parse({
      teeth: item.teeth,
      width: item.width,
      bore: item.bore,
      sku: item.sku,
      url: 'https://www.revrobotics.com/RT25-Pulleys/',
    });
    pulleys.push(revPulleyToJsonPulley(revPulley));
  }

  // GT2 pulleys
  pulleys.push({
    teeth: 16,
    width: 25.4,
    profile: 'GT2',
    pitch: 3,
    sku: 'REV-21-1909',
    url: 'https://www.revrobotics.com/neo-pinions/',
    bore: '8mm',
    vendor: 'REV',
  });
  pulleys.push({
    teeth: 12,
    width: 16,
    profile: 'GT2',
    pitch: 3,
    sku: 'REV-21-1908',
    url: 'https://www.revrobotics.com/550-motor-pinions/',
    bore: 'RS550',
    vendor: 'REV',
  });

  return pulleys;
}
