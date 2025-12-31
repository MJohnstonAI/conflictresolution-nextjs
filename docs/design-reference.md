# Conflict Resolution - Design Reference

## Brand and tone
- Navy and gold core palette with high-contrast typography.
- Serif headlines (Playfair Display) and sans body text (Inter).
- Tactical, focused language with a clean "war room" aesthetic.

## Theme system
- The app sets a data-theme attribute on the document root.
- Themes: dark (default), light, aura, midnight, slate, sapphire, nordic.
- The system theme maps to OS preference.

## Core color tokens (dark theme)
- --navy-950: #020617
- --navy-900: #0f172a
- --navy-800: #1e293b
- --gold-400: #fbbf24
- --gold-500: #f59e0b
- --gold-600: #d97706
- --slate-100: #ffffff
- --slate-500: #64748b
- --action-bg: #1e293b
- --action-hover: #334155
- --select-active-bg: #334155
- --select-inactive-bg: #0f172a

For full token sets across themes, see app/globals.css.

## Layout and structure
- Desktop sidebar width: 16rem (w-64).
- Main layout uses full viewport height with scrollable content.
- Cards and modals use rounded-xl or rounded-2xl with subtle borders.
- Mobile navigation is fixed to the bottom with safe-area padding.

## Motion
- animate-fade-in for page transitions.
- animate-spin for loaders.
