/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './public/**/*.html',
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: true,
  theme: {
    extend: {
      colors: {
        monaco: '#1E1E1E', // monaco-editor bg color
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)"
      }
    },
  },
  plugins: [],
}
