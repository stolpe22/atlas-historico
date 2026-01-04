import { useState, useEffect } from 'react';

const THEME_KEY = 'atlas-theme';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(THEME_KEY) || 'system';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    const effectiveTheme = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

    root.classList.add(effectiveTheme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return { theme, setTheme };
}