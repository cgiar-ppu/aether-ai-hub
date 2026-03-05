import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      // Check localStorage first
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      // Check if dark class is present (for SSR compatibility)
      if (document.documentElement.classList.contains('dark')) {
        return 'dark';
      }
    }
    // Default to light
    return 'light';
  });

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Persist to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return { theme, toggleTheme };
}
