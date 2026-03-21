import {
  type ParserMap,
  type inferParserType,
  createLoader,
  createSerializer,
} from 'nuqs';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';

export function useQueryParams<M extends ParserMap>(
  map: M,
): inferParserType<M> {
  const { search } = useLocation();
  const load = useMemo(() => createLoader(map), [map]);
  return useMemo(() => load(new URLSearchParams(search)), [load, search]);
}

export function useSerializedState<M extends ParserMap>(
  map: M,
  state: inferParserType<M>,
): string {
  const serialize = useMemo(
    () => createSerializer(map, { clearOnDefault: false }),
    [map],
  );
  const qs = serialize(state);
  // createSerializer returns a string starting with '?'; strip it
  return qs.startsWith('?') ? qs.slice(1) : qs;
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
