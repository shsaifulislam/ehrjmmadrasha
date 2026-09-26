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
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-outfit)", "sans-serif"],
        bengali: ["var(--font-hind-siliguri)", "sans-serif"],
        arabic: ["var(--font-amiri)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
