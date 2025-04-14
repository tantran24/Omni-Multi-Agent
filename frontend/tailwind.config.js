/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        claude: {
          purple: "#8E44AD",
          lavender: "#9B59B6",
          light: "#F5F7F9",
          dark: "#27272A",
          gray: "#71717A",
          border: "#E4E4E7",
        },
        border: "var(--border)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Poppins", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        soft: "0 2px 15px 0 rgba(0, 0, 0, 0.05)",
        message: "0 1px 2px rgba(0, 0, 0, 0.05)",
      },
      animation: {
        typing: "typing 1.2s steps(3) infinite",
      },
      keyframes: {
        typing: {
          "0%, 100%": { content: '"."' },
          "33%": { content: '".."' },
          "66%": { content: '"..."' },
        },
      },
    },
  },
  plugins: [],
};
