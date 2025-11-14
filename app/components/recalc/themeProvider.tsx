import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

function ThemeProviderInner({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return defaultTheme;
    }
    const stored = localStorage.getItem(storageKey) as Theme | null;
    return stored && ['light', 'dark', 'system'].includes(stored)
      ? stored
      : defaultTheme;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const handleSetTheme = useCallback(
    (newTheme: Theme) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, newTheme);
      }
      setTheme(newTheme);
    },
    [storageKey],
  );

  const value = useMemo(
    () => ({
      theme,
      setTheme: handleSetTheme,
    }),
    [theme, handleSetTheme],
  );

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
}: ThemeProviderProps) {
  if (typeof window === 'undefined') {
    return (
      <ThemeProviderContext.Provider
        value={{
          theme: defaultTheme,
          setTheme: () => {
            // No-op during SSR
          },
        }}
      >
        {children}
      </ThemeProviderContext.Provider>
    );
  }

  return (
    <ThemeProviderInner defaultTheme={defaultTheme} storageKey={storageKey}>
      {children}
    </ThemeProviderInner>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
