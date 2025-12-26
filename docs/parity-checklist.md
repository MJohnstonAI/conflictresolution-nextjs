# Parity Checklist

## Routes and Screens (SPA HashRouter)
- / (Start New Case / Home)
- /auth (Sign in, Sign up, Magic Link, Password reset)
- /demo (Demo scenario selection)
- /vault (Case Vault)
- /templates (Template Library)
- /testimonials (Success Stories)
- /help (Help Center with Guide, FAQ, Contact)
- /unlock/credits (Case File Store)
- /case/:id (War Room case detail)

## Interactions by Route
### /
- Sidebar navigation (desktop) and bottom nav (mobile)
- Sign in / sign out button (auth state)
- Try Demo Mode button
- Settings modal with theme selector and Done
- Wallet credits button (nav footer)
- Demo banner click -> /demo
- Opponent combobox selector
- Conditional custom adversary input when "Other"
- Case textarea input
- Start Analysis button (disabled when invalid)
- Case setup modal (Standard vs Professional)
  - Buy/Assign credit buttons
  - Return Home button
  - Close (X) and Done

### /auth
- Email input, password input (show/hide)
- Full name input (sign up)
- Password strength meter (sign up)
- Sign in / sign up / forgot / update flows
- Magic link flow (send + resend cooldown)
- Google OAuth button
- Form submit buttons per view
- Toggle between sign in and sign up
- Back to home link

### /demo
- Back to home
- Start Standard Demo
- Start Premium Demo

### /vault
- Search input
- Case cards clickable -> /case/:id
- Overflow menu per case (export markdown, print/PDF, edit, delete)
- Edit case modal (title, note, save/cancel)
- Delete confirmation dialog
- Retry sync button (when sync warning shown)
- Create new case CTA (empty state)

### /templates
- Search input
- Copy template button
- Use template button -> / with prefilled state
- Loading / empty / error states

### /testimonials
- Back button (mobile)
- Mailto "Share Your Story"

### /help
- Tabs: Guide, FAQ, Contact
- FAQ accordion expand/collapse
- Contact form submit (toast)
- Copy support email button

### /unlock/credits
- Purchase buttons for Standard and Premium packs
- Back to dashboard link

### /case/:id (War Room)
- Back to vault, Home button
- Round navigation (prev/next)
- Sender name input
- Opponent text textarea input
- Analyze button (disabled while analyzing/closed/empty)
- Toggle raw text vs summary
- Tone selector buttons (Peacekeeper, Barrister, Grey Rock, Nuclear)
- Copy response button
- Next round button
- Print/PDF button

## Shared Layout
- Desktop: fixed sidebar width 16rem (w-64), main content scrolls
- Mobile: fixed bottom navigation bar
- App container: h-screen, flex layout, background navy-950
- Top bars on some pages are sticky (Help tab header, War Room header)

## Typography Tokens
- Fonts
  - Sans: Inter (400, 500, 600, 700)
  - Serif: Playfair Display (400, 600, 700, italic variants)
  - Mono: default Tailwind mono stack (used for labels/metrics)
- Sizes (Tailwind defaults used)
  - text-[9px], text-[10px], text-xs (0.75rem), text-sm (0.875rem), text-base (1rem)
  - text-lg (1.125rem), text-xl (1.25rem), text-2xl (1.5rem), text-3xl (1.875rem), text-4xl (2.25rem)
- Weights
  - font-normal, font-medium, font-semibold, font-bold, font-black
- Letter spacing
  - uppercase tracking-wider and tracking-widest used for labels

## Color Tokens (CSS Variables)
### Shape
- --radius-lg: 0.5rem
- --radius-xl: 0.75rem
- --radius-2xl: 1rem

### Default / Dark Theme (data-theme = dark or unset)
- --navy-950: #020617
- --navy-900: #0f172a
- --navy-800: #1e293b
- --navy-700: #334155
- --gold-400: #fbbf24
- --gold-500: #f59e0b
- --gold-600: #d97706
- --slate-100: #ffffff
- --slate-200: #e2e8f0
- --slate-300: #cbd5e1
- --slate-400: #94a3b8
- --slate-500: #64748b
- --action-bg: #1e293b
- --action-hover: #334155
- --action-text: #ffffff
- --select-active-bg: #334155
- --select-active-text: #fbbf24
- --select-inactive-bg: #0f172a
- --select-inactive-text: #94a3b8
- --color-success: #34d399
- --color-warning: #fbbf24
- --color-danger: #fb7185
- --color-info: #60a5fa
- --badge-blue-bg: rgba(59, 130, 246, 0.1)
- --badge-blue-text: #93c5fd
- --badge-blue-border: rgba(59, 130, 246, 0.2)
- --badge-red-bg: rgba(244, 63, 94, 0.1)
- --badge-red-text: #fda4af
- --badge-red-border: rgba(244, 63, 94, 0.2)
- --badge-amber-bg: rgba(245, 158, 11, 0.1)
- --badge-amber-text: #fcd34d
- --badge-amber-border: rgba(245, 158, 11, 0.2)
- --badge-green-bg: rgba(16, 185, 129, 0.1)
- --badge-green-text: #6ee7b7
- --badge-green-border: rgba(16, 185, 129, 0.2)
- --badge-gray-bg: rgba(100, 116, 139, 0.3)
- --badge-gray-text: #cbd5e1
- --badge-gray-border: rgba(100, 116, 139, 0.5)

### Light Theme (data-theme = light)
- --navy-950: #ffffff
- --navy-900: #f8fafc
- --navy-800: #e2e8f0
- --navy-700: #cbd5e1
- --gold-400: #d97706
- --gold-500: #b45309
- --gold-600: #92400e
- --slate-100: #000000
- --slate-200: #1e293b
- --slate-300: #334155
- --slate-400: #475569
- --slate-500: #64748b
- --action-bg: #2563eb
- --action-hover: #1d4ed8
- --action-text: #ffffff
- --select-active-bg: #2563eb
- --select-active-text: #ffffff
- --select-inactive-bg: #f1f5f9
- --select-inactive-text: #0f172a
- --color-success: #059669
- --color-warning: #d97706
- --color-danger: #e11d48
- --color-info: #2563eb
- --badge-blue-bg: #e0f2fe
- --badge-blue-text: #0284c7
- --badge-blue-border: #bae6fd
- --badge-red-bg: #ffe4e6
- --badge-red-text: #e11d48
- --badge-red-border: #fecdd3
- --badge-amber-bg: #fef3c7
- --badge-amber-text: #d97706
- --badge-amber-border: #fde68a
- --badge-green-bg: #d1fae5
- --badge-green-text: #059669
- --badge-green-border: #a7f3d0
- --badge-gray-bg: #f1f5f9
- --badge-gray-text: #475569
- --badge-gray-border: #e2e8f0

### Aura Theme (data-theme = aura)
- --radius-lg: 2px
- --radius-xl: 4px
- --radius-2xl: 6px
- --navy-950: #f5f2eb
- --navy-900: #ebe7de
- --navy-800: #d6d1c7
- --navy-700: #c2bdb3
- --gold-400: #b45309
- --gold-500: #92400e
- --gold-600: #78350f
- --slate-100: #2c2a26
- --slate-200: #2c2a26
- --slate-300: #5d5a53
- --slate-400: #57534e
- --slate-500: #78716c
- --action-bg: #2c2a26
- --action-hover: #44413c
- --action-text: #f5f2eb
- --select-active-bg: #d6d1c7
- --select-active-text: #2c2a26
- --select-inactive-bg: #f5f2eb
- --select-inactive-text: #57534e
- --color-success: #15803d
- --color-warning: #b45309
- --color-danger: #be123c
- --color-info: #1d4ed8
- --badge-blue-bg: #e0f2fe
- --badge-blue-text: #0369a1
- --badge-blue-border: #bae6fd
- --badge-red-bg: #ffe4e6
- --badge-red-text: #be123c
- --badge-red-border: #fecdd3
- --badge-amber-bg: #fef3c7
- --badge-amber-text: #b45309
- --badge-amber-border: #fde68a
- --badge-green-bg: #dcfce7
- --badge-green-text: #15803d
- --badge-green-border: #bbf7d0
- --badge-gray-bg: #ebe7de
- --badge-gray-text: #57534e
- --badge-gray-border: #d6d1c7

### Midnight Theme (data-theme = midnight)
- --navy-950: #000000
- --navy-900: #0a0a0a
- --navy-800: #262626
- --navy-700: #404040
- --gold-400: #fde047
- --gold-500: #facc15
- --gold-600: #eab308
- --slate-100: #ffffff
- --slate-200: #ededed
- --slate-300: #d4d4d4
- --slate-400: #a3a3a3
- --slate-500: #737373
- --action-bg: #262626
- --action-hover: #404040
- --action-text: #facc15
- --select-active-bg: #facc15
- --select-active-text: #000000
- --select-inactive-bg: #000000
- --select-inactive-text: #a3a3a3

### Slate Theme (data-theme = slate)
- --navy-950: #09090b
- --navy-900: #18181b
- --navy-800: #27272a
- --navy-700: #3f3f46
- --gold-400: #e4e4e7
- --gold-500: #ffffff
- --gold-600: #d4d4d8
- --slate-100: #ffffff
- --slate-200: #a1a1aa
- --slate-300: #71717a
- --slate-400: #52525b
- --slate-500: #3f3f46
- --action-bg: #27272a
- --action-hover: #3f3f46
- --action-text: #ffffff
- --select-active-bg: #ffffff
- --select-active-text: #09090b
- --select-inactive-bg: #09090b
- --select-inactive-text: #52525b

### Sapphire Theme (data-theme = sapphire)
- --navy-950: #041010
- --navy-900: #0a1f20
- --navy-800: #116466
- --navy-700: #2d8285
- --gold-400: #fef08a
- --gold-500: #ffcb9a
- --gold-600: #ffcb9a
- --slate-100: #ffffff
- --slate-200: #ffffff
- --slate-300: #38bdf8
- --slate-400: #0ea5e9
- --slate-500: #ffcb9a
- --action-bg: #116466
- --action-hover: #0e5052
- --action-text: #ffffff
- --select-active-bg: #ffcb9a
- --select-active-text: #041010
- --select-inactive-bg: #0a1f20
- --select-inactive-text: #38bdf8

### Nordic Theme (data-theme = nordic)
- --navy-950: #0f172a
- --navy-900: #1e293b
- --navy-800: #334155
- --navy-700: #475569
- --gold-400: #38bdf8
- --gold-500: #0ea5e9
- --gold-600: #0284c7
- --slate-100: #f0f9ff
- --slate-200: #bae6fd
- --slate-300: #7dd3fc
- --slate-400: #38bdf8
- --slate-500: #0ea5e9
- --action-bg: #1e293b
- --action-hover: #334155
- --action-text: #38bdf8
- --select-active-bg: #0ea5e9
- --select-active-text: #ffffff
- --select-inactive-bg: #0f172a
- --select-inactive-text: #475569

## Spacing and Layout Constraints
- Sidebar width: 16rem (w-64); header height 4rem (h-16)
- Main layout: h-screen, overflow hidden; content areas scroll
- Common page padding: px-6, md:px-10; max widths 4xl, 5xl, 7xl depending on view
- War Room max container width: 1600px
- Mobile bottom nav height 4rem (h-16) with safe-area padding
- Cards and modals use rounded-xl or rounded-2xl with consistent borders

## Animations and Motion
- fadeIn keyframes used as animate-fade-in (0.7s ease-out)
- animate-spin used for loaders
- animate-pulse used for subtle emphasis
- animate-shake used on auth error (not defined in CSS; needs parity)

## Assets and Image Domains
- Remote image: cdn-icons-png.flaticon.com (og image, favicon, manifest)
- Fonts: fonts.googleapis.com, fonts.gstatic.com (Inter, Playfair Display)
