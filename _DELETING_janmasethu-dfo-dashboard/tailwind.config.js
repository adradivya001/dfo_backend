/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#BAE6FD', // light blue
          DEFAULT: '#0EA5E9', // sky blue
          dark: '#0369A1', // darker blue
        },
        secondary: {
          light: '#F0F9FF',
          DEFAULT: '#38BDF8',
          dark: '#0284C7',
        },
        'brand-bg': '#F0F4F8',
        'brand-surface': '#FFFFFF',
        'text-main': '#0F172A',
        'text-dim': '#475569',
        'soft-gray': '#E2E8F0',
        'accent': '#F8FAFC',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft-lg': '0 20px 40px -15px rgba(14, 165, 233, 0.12)',
        'aura': '0 10px 30px -5px rgba(56, 189, 248, 0.2)',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
