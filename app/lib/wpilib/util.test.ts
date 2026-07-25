import { beforeEach, describe, expect, it, vi } from 'vitest';

import { arrayToVectorDouble } from '~/lib/wpilib/util';

// push_back is called on instances; track calls across all instances.
const pushBackMock = vi.fn<(value: number) => void>();

// VectorDouble is used with `new`, so the mock must be a proper constructor.
// We use a class expression so vitest does not warn about non-constructor fn.
class FakeVectorDouble {
  push_back = pushBackMock;
}

vi.mock('~/lib/wpilib/wpilibc', () => ({
  getWpilibcModuleSync: () => ({ VectorDouble: FakeVectorDouble }),
}));

describe('arrayToVectorDouble', () => {
  beforeEach(() => {
    pushBackMock.mockReset();
  });

  it('returns a VectorDouble instance', () => {
    const result = arrayToVectorDouble([]);
    expect(result).toBeInstanceOf(FakeVectorDouble);
  });

  it('does not call push_back for an empty array', () => {
    arrayToVectorDouble([]);
    expect(pushBackMock).not.toHaveBeenCalled();
  });

  it('calls push_back once for a single-element array', () => {
    arrayToVectorDouble([42]);
    expect(pushBackMock).toHaveBeenCalledTimes(1);
    expect(pushBackMock).toHaveBeenCalledWith(42);
  });

  it('calls push_back for each element in order', () => {
    arrayToVectorDouble([1, 2, 3]);
    expect(pushBackMock).toHaveBeenCalledTimes(3);
    expect(pushBackMock.mock.calls[0]![0]).toBe(1);
    expect(pushBackMock.mock.calls[1]![0]).toBe(2);
    expect(pushBackMock.mock.calls[2]![0]).toBe(3);
  });

  it('passes floating-point values correctly', () => {
    arrayToVectorDouble([1.5, -3.14, 0.0]);
    expect(pushBackMock).toHaveBeenCalledTimes(3);
    expect(pushBackMock.mock.calls[0]![0]).toBe(1.5);
    expect(pushBackMock.mock.calls[1]![0]).toBe(-3.14);
    expect(pushBackMock.mock.calls[2]![0]).toBe(0.0);
  });
});
