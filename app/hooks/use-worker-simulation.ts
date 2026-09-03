import { useEffect, useRef, useState } from 'react';

export interface SimulationToken {
  cancelled: boolean;
}

interface SettledSimulation<T> {
  key: string;
  data: T | null;
}

export function useWorkerSimulation<T>(
  key: string,
  run: (token: SimulationToken) => Promise<T>,
): { data: T | null; isLoading: boolean } {
  const [settled, setSettled] = useState<SettledSimulation<T> | null>(null);
  const runRef = useRef(run);

  useEffect(() => {
    runRef.current = run;
  });

  useEffect(() => {
    const token: SimulationToken = { cancelled: false };
    runRef
      .current(token)
      .then((data) => {
        if (!token.cancelled) {
          setSettled({ key, data });
        }
      })
      .catch((error: unknown) => {
        if (!token.cancelled) {
          console.error(error);
          setSettled({ key, data: null });
        }
      });
    return () => {
      token.cancelled = true;
    };
  }, [key]);

  const isSettled = settled?.key === key;
  return {
    data: isSettled ? settled.data : null,
    isLoading: !isSettled,
  };
}
