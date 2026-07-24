import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPool } from '~/lib/pool';

const { mockExec, mockTerminate, mockPool } = vi.hoisted(() => {
  const mockExec = vi.fn<(...args: unknown[]) => unknown>();
  const mockTerminate = vi.fn<(...args: unknown[]) => void>();
  const mockPool = vi.fn<
    (...args: unknown[]) => {
      exec: typeof mockExec;
      terminate: typeof mockTerminate;
    }
  >();
  return { mockExec, mockTerminate, mockPool };
});

vi.mock('workerpool', () => ({
  pool: mockPool,
}));

describe('getPool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPool.mockImplementation(() => ({
      exec: mockExec,
      terminate: mockTerminate,
    }));
  });

  it('calls workerpool.pool with the given script', () => {
    getPool('/workers/my-worker.js');
    expect(mockPool).toHaveBeenCalledTimes(1);
    expect(mockPool.mock.calls[0]![0]).toBe('/workers/my-worker.js');
  });

  it('passes default options when no options argument is provided', () => {
    getPool('/workers/my-worker.js');
    expect(mockPool.mock.calls[0]![1]).toEqual({
      workerType: 'web',
      workerOpts: { type: 'module' },
    });
  });

  it('merges caller options on top of defaults', () => {
    getPool('/workers/my-worker.js', { maxWorkers: 4 });
    expect(mockPool.mock.calls[0]![1]).toEqual({
      workerType: 'web',
      workerOpts: { type: 'module' },
      maxWorkers: 4,
    });
  });

  it('allows caller options to override defaults', () => {
    getPool('/workers/my-worker.js', {
      workerType: 'process',
      workerOpts: { type: 'classic' },
    });
    expect(mockPool.mock.calls[0]![1]).toEqual({
      workerType: 'process',
      workerOpts: { type: 'classic' },
    });
  });

  it('exposes exec and terminate properties on the returned object', () => {
    const pool = getPool('/workers/my-worker.js');
    expect(pool).toHaveProperty('exec');
    expect(pool).toHaveProperty('terminate');
  });

  it('delegates exec calls to the underlying pool', () => {
    interface FakeWorkerApi {
      myMethod: (a: number, b: number, c: number) => Promise<number>;
    }

    const expectedResult = Promise.resolve(42);
    mockExec.mockReturnValueOnce(expectedResult);

    const pool = getPool<FakeWorkerApi>('/workers/my-worker.js');
    void pool.exec('myMethod', [1, 2, 3]);

    expect(mockExec).toHaveBeenCalledWith('myMethod', [1, 2, 3]);
  });

  it('delegates terminate calls to the underlying pool', () => {
    const pool = getPool('/workers/my-worker.js');
    void pool.terminate(true, 1000);
    expect(mockTerminate).toHaveBeenCalledWith(true, 1000);
  });
});
