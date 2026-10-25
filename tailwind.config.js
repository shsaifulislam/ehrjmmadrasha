/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        madrasah: {
          emerald: "#0D5C3A",
          "emerald-dark": "#083B25",
          "emerald-light": "#158052",
          "emerald-subtle": "#E7F3EC",
          gold: "#C59B27",
          "gold-light": "#F3E5AB",
          "gold-dark": "#9A781D",
          ivory: "#F9F8F3",
          slate: "#0B1914",
          whisper: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ["'Hind Siliguri'", "var(--font-inter)", "sans-serif"],
        serif: ["'Noto Serif Bengali'", "serif"],
        display: ["'Noto Serif Bengali'", "'Hind Siliguri'", "sans-serif"],
        bengali: ["'Hind Siliguri'", "'Noto Serif Bengali'", "sans-serif"],
        arabic: ["'Amiri'", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
