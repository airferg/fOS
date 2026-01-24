import type { Config } from "tailwindcss";

export default {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.625rem',
        'xs': '0.75rem',     // 12px (reduced from 0.875rem)
        'sm': '0.8125rem',   // 13px (reduced from 0.875rem)
        'base': '0.875rem',  // 14px (reduced from 1rem)
        'lg': '0.9375rem',   // 15px (reduced from 1.125rem)
        'xl': '1rem',        // 16px (reduced from 1.25rem)
        '2xl': '1.25rem',    // 20px (reduced from 1.5rem)
        '3xl': '1.5rem',     // 24px (reduced from 1.875rem)
        '4xl': '1.875rem',   // 30px (reduced from 2.25rem)
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.05)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
