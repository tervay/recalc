// TypeScript wrapper for wpimath WASM module
import type { MainModule } from '~/lib/generated/wpimath/wpimath_wasm';
import wpimathModuleFactory from '~/lib/generated/wpimath/wpimath_wasm.js';

let moduleInstance: MainModule | null = null;
let modulePromise: Promise<MainModule> | null = null;

/**
 * Initialize the wpimath WASM module
 */
export async function initWpimath(): Promise<MainModule> {
  if (moduleInstance) {
    return moduleInstance;
  }

  if (modulePromise) {
    return modulePromise;
  }

  modulePromise = wpimathModuleFactory({
    locateFile: (path: string) => {
      // Resolve WASM file path relative to the generated directory
      if (path.endsWith('.wasm')) {
        // Use URL constructor which works in both browser and Node.js
        return new URL(`../generated/wpimath/${path}`, import.meta.url).href;
      }
      return path;
    },
  });

  moduleInstance = await modulePromise;
  // Module is ready to use - no explicit initialization needed
  return moduleInstance;
}

/**
 * Get the wpimath module instance (initializes if needed)
 */
export function getWpimathModule(): Promise<MainModule> {
  return initWpimath();
}

// Re-export types
export type { MainModule };
