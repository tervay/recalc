import type { MainModule } from '~/lib/generated/wpilibc/wpilibc_wasm';
import wpilibcModuleFactory from '~/lib/generated/wpilibc/wpilibc_wasm.js';

let moduleInstance: MainModule | null = null;
let modulePromise: Promise<MainModule> | null = null;

/**
 * Initialize the wpilibc WASM module
 */
export async function initWpilibc(): Promise<MainModule> {
  if (moduleInstance) {
    return moduleInstance;
  }

  if (modulePromise) {
    return modulePromise;
  }

  modulePromise = wpilibcModuleFactory({
    locateFile: (path: string) => {
      // Resolve WASM file path relative to the generated directory
      if (path.endsWith('.wasm')) {
        // Use URL constructor which works in both browser and Node.js
        return new URL(`../../generated/wpilibc/${path}`, import.meta.url).href;
      }
      return path;
    },
  });

  moduleInstance = await modulePromise;
  // Module is ready to use - no explicit initialization needed
  return moduleInstance;
}

/**
 * Get the wpilibc module instance (initializes if needed)
 */
export function getWpilibcModule(): Promise<MainModule> {
  return initWpilibc();
}

/**
 * Get the wpilibc module instance synchronously (throws if not initialized)
 * Use this after calling initWpilibc() to avoid promisifying everything
 */
export function getWpilibcModuleSync(): MainModule {
  if (!moduleInstance) {
    throw new Error(
      'wpilibc module not initialized. Call initWpilibc() first or await getWpilibcModule()',
    );
  }
  return moduleInstance;
}

// Re-export types
export type { MainModule };
