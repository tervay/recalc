import { validateParsedData } from 'scripts/ingest/validation/index';
import { describe, expect, it } from 'vitest';

import type { JSONBelt } from '~/lib/types/belts';
import type { JSONGear } from '~/lib/types/gears';
import type { JSONPulley } from '~/lib/types/pulleys';
import type { JSONSprocket } from '~/lib/types/sprockets';

describe('validateParsedData', () => {
  describe('pulleys', () => {
    const validPulley: JSONPulley = {
      teeth: 20,
      width: 9,
      profile: 'HTD',
      pitch: 5,
      sku: 'WCP-0001',
      url: 'https://wcproducts.com/products/test',
      bore: '1/2" Hex',
      vendor: 'WCP',
    };

    it('should pass valid pulley data', () => {
      const { valid, errors } = validateParsedData('pulleys', [validPulley]);
      expect(valid).toHaveLength(1);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid vendor', () => {
      const invalid = { ...validPulley, vendor: 'FakeVendor' };
      const { valid, errors } = validateParsedData('pulleys', [invalid]);
      expect(valid).toHaveLength(0);
      expect(errors).toHaveLength(1);
      expect(errors[0].index).toBe(0);
    });

    it('should reject missing required field', () => {
      const { teeth: _teeth, ...withoutTeeth } = validPulley;
      const { valid, errors } = validateParsedData('pulleys', [withoutTeeth]);
      expect(valid).toHaveLength(0);
      expect(errors).toHaveLength(1);
    });

    it('should pass empty array', () => {
      const { valid, errors } = validateParsedData('pulleys', []);
      expect(valid).toHaveLength(0);
      expect(errors).toHaveLength(0);
    });

    it('should separate valid from invalid items', () => {
      const invalid = { ...validPulley, vendor: 'BadVendor' };
      const { valid, errors } = validateParsedData('pulleys', [
        validPulley,
        invalid,
        validPulley,
      ]);
      expect(valid).toHaveLength(2);
      expect(errors).toHaveLength(1);
      expect(errors[0].index).toBe(1);
    });
  });

  describe('belts', () => {
    const validBelt: JSONBelt = {
      teeth: 100,
      width: 15,
      profile: 'HTD',
      pitch: 5,
      sku: 'WCP-0100',
      url: 'https://wcproducts.com/products/belt',
      vendor: 'WCP',
    };

    it('should pass valid belt data', () => {
      const { valid, errors } = validateParsedData('belts', [validBelt]);
      expect(valid).toHaveLength(1);
      expect(errors).toHaveLength(0);
    });

    it('should allow null sku', () => {
      const beltNullSku = { ...validBelt, sku: null };
      const { valid, errors } = validateParsedData('belts', [beltNullSku]);
      expect(valid).toHaveLength(1);
      expect(errors).toHaveLength(0);
    });
  });

  describe('sprockets', () => {
    const validSprocket: JSONSprocket = {
      teeth: 16,
      bore: '1/2" Hex',
      chainType: '#25',
      url: 'https://wcproducts.com/products/sprocket',
      sku: 'WCP-0200',
      vendor: 'WCP',
    };

    it('should pass valid sprocket data', () => {
      const { valid, errors } = validateParsedData('sprockets', [
        validSprocket,
      ]);
      expect(valid).toHaveLength(1);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid chain type', () => {
      const invalid = { ...validSprocket, chainType: '#50' };
      const { valid, errors } = validateParsedData('sprockets', [invalid]);
      expect(valid).toHaveLength(0);
      expect(errors).toHaveLength(1);
    });
  });

  describe('gears', () => {
    const validGear: JSONGear = {
      teeth: 20,
      dp: 20,
      bore: '1/2" Hex',
      url: 'https://wcproducts.com/products/gear',
      sku: 'WCP-0300',
      vendor: 'WCP',
    };

    it('should pass valid gear data', () => {
      const { valid, errors } = validateParsedData('gears', [validGear]);
      expect(valid).toHaveLength(1);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid bore', () => {
      const invalid = { ...validGear, bore: 'InvalidBore' };
      const { valid, errors } = validateParsedData('gears', [invalid]);
      expect(valid).toHaveLength(0);
      expect(errors).toHaveLength(1);
    });
  });
});
