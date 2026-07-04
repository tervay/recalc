import type { Config } from '@react-router/dev/config';
import { vercelPreset } from '@vercel/react-router/vite';

// Dev-only routes that should never be prerendered or indexed.
const EXCLUDED_PRERENDER_PATHS = ['/dev/error'];

export default {
  ssr: false,
  async prerender({ getStaticPaths }) {
    // Bake every real route to static HTML at build time so its meta tags,
    // canonical link, and JSON-LD are present in the initial response for
    // crawlers and social scrapers (SPA mode alone only renders them after
    // client JS executes).
    return getStaticPaths().filter(
      (path) => !EXCLUDED_PRERENDER_PATHS.includes(path),
    );
  },
  presets: [vercelPreset()],
} satisfies Config;
