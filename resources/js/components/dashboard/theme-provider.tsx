import { createContext, useContext, useEffect, useState } from 'react';


type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  setThemeWithTransition: (theme: Theme, event?: MouseEvent) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  setThemeWithTransition: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  );

  const applyTheme = (theme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  };

  const setThemeWithTransition = (newTheme: Theme, event?: MouseEvent) => {
    const root = document.documentElement;
    const resolvedTheme =
      newTheme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : newTheme;

    localStorage.setItem(storageKey, newTheme);

    if (!document.startViewTransition) {
      setThemeState(newTheme);
      applyTheme(resolvedTheme);
      return;
    }

    if (event) {
      root.style.setProperty('--x', `${event.clientX}px`);
      root.style.setProperty('--y', `${event.clientY}px`);
    }

    document.startViewTransition(() => {
      setThemeState(newTheme);
      applyTheme(resolvedTheme);
    });
  };

  const value = {
    theme,
    setTheme,
    setThemeWithTransition,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
