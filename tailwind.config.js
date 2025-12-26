/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./views/**/*.{ts,tsx}",
    "./App.tsx"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        serif: ["var(--font-playfair)", "Playfair Display", "serif"]
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)"
      },
      colors: {
        navy: {
          950: "var(--navy-950)",
          900: "var(--navy-900)",
          800: "var(--navy-800)",
          700: "var(--navy-700)"
        },
        gold: {
          400: "var(--gold-400)",
          500: "var(--gold-500)",
          600: "var(--gold-600)"
        },
        slate: {
          100: "var(--slate-100)",
          200: "var(--slate-200)",
          300: "var(--slate-300)",
          400: "var(--slate-400)",
          500: "var(--slate-500)"
        },
        action: {
          DEFAULT: "var(--action-bg)",
          hover: "var(--action-hover)"
        }
      },
      spacing: {
        "safe-area": "env(safe-area-inset-bottom)"
      }
    }
  },
  plugins: []
};
