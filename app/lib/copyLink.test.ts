// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildCopyLinkData,
  handleCopyLink,
  strictlyEncodeQueryString,
  type TrackFn,
} from '~/lib/copyLink';

describe('strictlyEncodeQueryString', () => {
  it('percent-encodes the braces nuqs leaves raw in a MeasurementParam value', () => {
    expect(
      strictlyEncodeQueryString('length={%22s%22:60,%22u%22:%22in%22}'),
    ).toBe('length=%7B%22s%22%3A60%2C%22u%22%3A%22in%22%7D');
  });

  it('percent-encodes the nested brackets in a RatioPairListParam value', () => {
    expect(strictlyEncodeQueryString('pairs=[[18,72],[24,48]]')).toBe(
      'pairs=%5B%5B18%2C72%5D%2C%5B24%2C48%5D%5D',
    );
  });

  it('percent-encodes the parentheses in a motor name like "Kraken X60 (FOC)"', () => {
    expect(
      strictlyEncodeQueryString('motor={%22name%22:%22Kraken+X60+(FOC)%22}'),
    ).toBe('motor=%7B%22name%22%3A%22Kraken+X60+%28FOC%29%22%7D');
  });

  it('leaves no bare brace, bracket or comma anywhere in the output', () => {
    const encoded = strictlyEncodeQueryString(
      'motor={%22name%22:%22NEO%22,%22quantity%22:2}&pairs=[[18,72]]',
    );

    expect(encoded).not.toMatch(/[{}[\],]/);
  });

  it('does not double-encode a literal percent sign in a value', () => {
    // nuqs escapes a literal '%' to '%25'; re-encoding must not make it '%2525'
    expect(strictlyEncodeQueryString('efficiency=100%25')).toBe(
      'efficiency=100%25',
    );
  });

  it('does not double-encode a literal plus sign in a value', () => {
    // nuqs escapes a literal '+' to '%2B'
    expect(strictlyEncodeQueryString('label=1%2B1')).toBe('label=1%2B1');
  });

  it('preserves a space encoded as "+" rather than turning it into a literal plus', () => {
    expect(strictlyEncodeQueryString('motor=Kraken+X60')).toBe(
      'motor=Kraken+X60',
    );
  });

  it('preserves a literal ampersand inside a value without splitting the param', () => {
    const encoded = strictlyEncodeQueryString('name=a%26b&other=1');

    expect(encoded).toBe('name=a%26b&other=1');
    expect(new URLSearchParams(encoded).get('name')).toBe('a&b');
  });

  it('preserves param order', () => {
    expect(strictlyEncodeQueryString('z=1&a=2&m=3')).toBe('z=1&a=2&m=3');
  });

  it('is idempotent — encoding an already-strict string changes nothing', () => {
    const once = strictlyEncodeQueryString(
      'length={%22s%22:60,%22u%22:%22in%22}',
    );

    expect(strictlyEncodeQueryString(once)).toBe(once);
  });

  it('returns an empty string for an empty input', () => {
    expect(strictlyEncodeQueryString('')).toBe('');
  });
});

describe('buildCopyLinkData', () => {
  it('includes the motor identifier when a valid motor query param is present', () => {
    const motorParam = JSON.stringify({
      name: 'Kraken X60 (FOC)',
      quantity: 1,
    });
    const search = `?motor=${encodeURIComponent(motorParam)}`;

    expect(buildCopyLinkData('Arm Calculator', search)).toEqual({
      calculator: 'Arm Calculator',
      motor: 'Kraken X60 (FOC)',
    });
  });

  it('omits the motor field when no motor query param is present', () => {
    const data = buildCopyLinkData('Gears Calculator', '');

    expect(data).toEqual({ calculator: 'Gears Calculator' });
    expect(data).not.toHaveProperty('motor');
  });

  it('omits the motor field when the motor query param is invalid', () => {
    const data = buildCopyLinkData('Arm Calculator', '?motor=not-json');

    expect(data).toEqual({ calculator: 'Arm Calculator' });
    expect(data).not.toHaveProperty('motor');
  });

  it('reads the motor from a serialized state string without a leading "?"', () => {
    const motorParam = JSON.stringify({ name: 'NEO', quantity: 2 });
    const serialized = `motor=${encodeURIComponent(motorParam)}`;

    expect(buildCopyLinkData('Arm Calculator', serialized)).toEqual({
      calculator: 'Arm Calculator',
      motor: 'NEO',
    });
  });

  it('reads the motor from a serialized state string with other params present', () => {
    const motorParam = JSON.stringify({ name: 'Kraken X60', quantity: 1 });
    const serialized = `angle=45&motor=${encodeURIComponent(motorParam)}&mass=10`;

    expect(buildCopyLinkData('Flywheel Calculator', serialized)).toEqual({
      calculator: 'Flywheel Calculator',
      motor: 'Kraken X60',
    });
  });
});

describe('handleCopyLink', () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi
      .fn<(text: string) => Promise<void>>()
      .mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
  });

  it('copies a URL built from the serialized state', () => {
    const track = vi.fn<TrackFn>();

    handleCopyLink({
      title: 'Arm Calculator',
      serializedState: 'ratio=2',
      track,
    });

    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}${window.location.pathname}?ratio=2`,
    );
  });

  it('strictly encodes the copied URL so no bare braces or brackets survive', () => {
    const track = vi.fn<TrackFn>();

    handleCopyLink({
      title: 'Linear Mechanism Calculator',
      serializedState:
        'motor={%22name%22:%22Kraken+X60+(FOC)%22,%22quantity%22:1}&pairs=[[18,72]]',
      track,
    });

    const copied: string = writeText.mock.calls[0][0];

    expect(copied).toBe(
      `${window.location.origin}${window.location.pathname}` +
        '?motor=%7B%22name%22%3A%22Kraken+X60+%28FOC%29%22%2C%22quantity%22%3A1%7D' +
        '&pairs=%5B%5B18%2C72%5D%5D',
    );
    expect(copied.slice(copied.indexOf('?'))).not.toMatch(/[{}[\],]/);
  });

  it('copies a URL whose params still decode to the original values', () => {
    const track = vi.fn<TrackFn>();
    const serializedState = 'travelDistance={%22s%22:60,%22u%22:%22in%22}';

    handleCopyLink({
      title: 'Linear Mechanism Calculator',
      serializedState,
      track,
    });

    const copied: string = writeText.mock.calls[0][0];

    expect(new URL(copied).searchParams.get('travelDistance')).toBe(
      '{"s":60,"u":"in"}',
    );
  });

  it('tracks copy-link with the motor from the same serialized state that was copied', () => {
    const track = vi.fn<TrackFn>();
    const motorParam = JSON.stringify({ name: 'NEO', quantity: 2 });
    const serializedState = `ratio=2&motor=${encodeURIComponent(motorParam)}`;

    handleCopyLink({ title: 'Flywheel Calculator', serializedState, track });

    expect(track).toHaveBeenCalledWith('copy-link', {
      calculator: 'Flywheel Calculator',
      motor: 'NEO',
    });
  });

  it('tracks copy-link without a motor field when the serialized state has none', () => {
    const track = vi.fn<TrackFn>();

    handleCopyLink({
      title: 'Gears Calculator',
      serializedState: 'gear1Teeth=40',
      track,
    });

    expect(track).toHaveBeenCalledWith('copy-link', {
      calculator: 'Gears Calculator',
    });
  });
});
