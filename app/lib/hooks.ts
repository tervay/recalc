/* eslint-disable @typescript-eslint/no-explicit-any */
import queryString from 'query-string';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';

import type {
  DefaultAndQueryParamProvider,
  QueryParam,
} from '~/lib/types/queryParams';

type QueryParamEncodeDecodeMapWithDefaults<
  T extends Record<string, QueryParam<any>>,
> = {
  [K in keyof T]: DefaultAndQueryParamProvider<T[K]>;
};

export function useQueryParams<T extends Record<string, any>>(
  map: QueryParamEncodeDecodeMapWithDefaults<T>,
): T {
  const { search } = useLocation();
  const parsed = queryString.parse(search);

  for (const key in map) {
    const value = parsed[key];
    if (value) {
      if (typeof value === 'string') {
        parsed[key] = map[key].queryParam.decode(value);
      }
    }
  }

  const result: Record<string, any> = {};
  for (const key in map) {
    result[key] = parsed[key] ?? map[key].defaultValue;
  }

  return result as T;
}

export function useSerializedState<T extends Record<string, any>>(
  map: QueryParamEncodeDecodeMapWithDefaults<T>,
  state: T,
): string {
  return useMemo(() => {
    const serializedObjects: Record<string, string> = {};

    for (const key in map) {
      const value = state[key];
      if (value !== undefined && value !== null) {
        try {
          serializedObjects[key] = map[key].queryParam.encode(value);
        } catch (error) {
          // Fallback to default if encoding fails
          console.warn(`Failed to encode ${key}:`, error);
          serializedObjects[key] = map[key].queryParam.encode(
            map[key].defaultValue,
          );
        }
      } else {
        // Use default value if state value is missing
        serializedObjects[key] = map[key].queryParam.encode(
          map[key].defaultValue,
        );
      }
    }

    return queryString.stringify(serializedObjects);
  }, [map, state]);
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
