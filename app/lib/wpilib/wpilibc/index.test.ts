import { beforeEach, describe, expect, it, vi } from 'vitest';

// The module under test uses a module-level singleton. Reset it between tests
// by re-importing after clearing the module registry.

// Stub the Emscripten factory so no real WASM is loaded.
const fakeModule = { VectorDouble: vi.fn<() => void>() };
const mockFactory = vi.fn<() => Promise<typeof fakeModule>>();

vi.mock('~/lib/generated/wpilibc/wpilibc_wasm.js', () => ({
  default: mockFactory,
}));

// Helper: fresh import of the module under test with a clean singleton state.
async function freshImport() {
  vi.resetModules();
  return import('~/lib/wpilib/wpilibc');
}

describe('getWpilibcModuleSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFactory.mockResolvedValue(fakeModule);
  });

  it('throws before initWpilibc has been called', async () => {
    const { getWpilibcModuleSync } = await freshImport();
    expect(() => getWpilibcModuleSync()).toThrow(
      'wpilibc module not initialized',
    );
  });

  it('returns the module after initWpilibc resolves', async () => {
    const { initWpilibc, getWpilibcModuleSync } = await freshImport();
    await initWpilibc();
    expect(getWpilibcModuleSync()).toBe(fakeModule);
  });
});

describe('initWpilibc', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFactory.mockResolvedValue(fakeModule);
  });

  it('calls the WASM factory exactly once on first call', async () => {
    const { initWpilibc } = await freshImport();
    await initWpilibc();
    expect(mockFactory).toHaveBeenCalledTimes(1);
  });

  it('returns the same module instance on repeated calls (caching)', async () => {
    const { initWpilibc } = await freshImport();
    const first = await initWpilibc();
    const second = await initWpilibc();
    expect(first).toBe(fakeModule);
    expect(second).toBe(fakeModule);
    // Factory must only be invoked once despite two awaited calls.
    expect(mockFactory).toHaveBeenCalledTimes(1);
  });

  it('returns the same promise when called concurrently (in-flight dedup)', async () => {
    const { initWpilibc } = await freshImport();
    // Fire two calls without awaiting in between.
    const p1 = initWpilibc();
    const p2 = initWpilibc();
    await Promise.all([p1, p2]);
    expect(mockFactory).toHaveBeenCalledTimes(1);
  });
});

describe('getWpilibcModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFactory.mockResolvedValue(fakeModule);
  });

  it('resolves to the module instance', async () => {
    const { getWpilibcModule } = await freshImport();
    const result = await getWpilibcModule();
    expect(result).toBe(fakeModule);
  });

  it('delegates to initWpilibc (factory called exactly once)', async () => {
    const { getWpilibcModule } = await freshImport();
    await getWpilibcModule();
    await getWpilibcModule();
    expect(mockFactory).toHaveBeenCalledTimes(1);
  });
});
