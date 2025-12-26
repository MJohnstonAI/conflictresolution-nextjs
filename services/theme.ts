
import { Theme } from '../types';

export const themeService = {
  init: () => {
    // 1. Load saved
    // Default to 'dark' instead of 'system' if no preference exists
    const saved = localStorage.getItem('conflictresolution_theme') as Theme || 'dark';
    themeService.apply(saved);

    // 2. Add System Listener (Only fires if OS theme changes)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // If the user has "System" selected, we need to re-apply logic when the OS changes
        if (themeService.get() === 'system') {
            themeService.apply('system');
        }
    });
  },

  set: (theme: Theme) => {
    localStorage.setItem('conflictresolution_theme', theme);
    themeService.apply(theme);
  },

  get: (): Theme => {
    // Default to 'dark' instead of 'system'
    return (localStorage.getItem('conflictresolution_theme') as Theme) || 'dark';
  },

  apply: (theme: Theme) => {
    const root = document.documentElement;
    let effectiveTheme = theme;

    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = systemDark ? 'dark' : 'light';
    }

    // Apply the attribute
    root.setAttribute('data-theme', effectiveTheme);
  }
};