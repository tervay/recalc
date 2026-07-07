import { join } from 'path';

import { FileSystemCache, NodeFetchCache } from 'node-fetch-cache';

// Shared on-disk cached fetch for all retrieval modules. Both successful (200)
// and not-found (404) responses are cached so reruns never re-hit vendor
// servers. Responses expose `isCacheMiss`, letting callers throttle only real
// network requests.
export const cachedFetch = NodeFetchCache.create({
  cache: new FileSystemCache({
    cacheDirectory: join(process.cwd(), '.cache'),
  }),
  shouldCacheResponse: (response) => [200, 404].includes(response.status),
});
