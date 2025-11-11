// TypeScript wrapper for wpimath WASM module
import type { MainModule } from 'app/lib/generated/wpimath/wpimath.d';
import wpimathModuleFactory from 'app/lib/generated/wpimath/wpimath.js';

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
        // Try multiple possible locations
        // In tests: relative to current working directory
        // In production: from public/assets or similar
        // For now, use a path that works in both contexts
        try {
          // Try importing the WASM file directly (works in Vite/bundlers)
          return new URL('../generated/wpimath/wpimath.wasm', import.meta.url)
            .href;
        } catch {
          // Fallback to relative path
          return './wpimath.wasm';
        }
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
