import { useState, useEffect } from 'react';

export function useTheme() {
  // Lê do localStorage ou usa 'system' como padrão
  const [theme, setTheme] = useState(
    localStorage.getItem('atlas-theme') || 'system'
  );

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove classes antigas
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    // Salva a escolha
    localStorage.setItem('atlas-theme', theme);
  }, [theme]);

  return { theme, setTheme };
}