/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#00c08b",
        midnight: "#00100b",
        accent: "#00976D",
        aqua: {
          100: "#00c08b",
          200: "#00976D",
        },
        graylight: {
          100: "#f5f5f5",
          200: "#e4e4e4",
          300: "#e2e8f0",
        },
        grayblacked: {
          100: "#00100b",
          200: "#001810",
        },
        dark: {
          surface: "#0c0c0c",
          bg: "#001E26",
        },
        ui: {
          bg: 'var(--ui-bg)',
          'bg-muted': 'var(--ui-bg-muted)',
          'bg-elevated': 'var(--ui-bg-elevated)',
          'bg-accented': 'var(--ui-bg-accented)',
          'text-muted': 'var(--ui-text-muted)',
          border: 'var(--ui-border)',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
