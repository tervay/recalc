// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildCopyLinkData,
  handleCopyLink,
  type TrackFn,
} from '~/lib/copyLink';

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
