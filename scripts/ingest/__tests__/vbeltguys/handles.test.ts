import { vbeltguysBeltHandles } from 'scripts/ingest/retrieval/vbeltguys';
import { describe, expect, it } from 'vitest';

describe('vbeltguysBeltHandles', () => {
  const handles = vbeltguysBeltHandles();

  it('generates teeth(20..1000) x pitch{3,5} x width{9,15} candidates', () => {
    // 981 teeth values * 2 pitches * 2 widths
    expect(handles).toHaveLength(981 * 2 * 2);
  });

  it('contains no duplicates', () => {
    expect(new Set(handles).size).toBe(handles.length);
  });

  it('builds the length as pitch * teeth with zero-padded 2-digit width', () => {
    // teeth 40, pitch 3, width 9 -> length 120, width "09"
    expect(handles).toContain('120-3m-09-synchronous-timing-belt');
    // teeth 40, pitch 3, width 15
    expect(handles).toContain('120-3m-15-synchronous-timing-belt');
    // teeth 25, pitch 5, width 9 -> length 125
    expect(handles).toContain('125-5m-09-synchronous-timing-belt');
  });

  it('covers the range endpoints', () => {
    // teeth 20, pitch 3, width 9 -> length 60
    expect(handles).toContain('60-3m-09-synchronous-timing-belt');
    // teeth 1000, pitch 5, width 15 -> length 5000
    expect(handles).toContain('5000-5m-15-synchronous-timing-belt');
  });

  it('excludes teeth below 20 and above 1000', () => {
    // teeth 19, pitch 3, width 9 -> length 57
    expect(handles).not.toContain('57-3m-09-synchronous-timing-belt');
    // teeth 1001, pitch 3, width 9 -> length 3003
    expect(handles).not.toContain('3003-3m-09-synchronous-timing-belt');
  });
});
