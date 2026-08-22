/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Backgrounds, borders, muted text — replaces the old navy "slate" scale.
        // Same 50→950 structure as slate, so every bg-/text-/border-coffee-* class
        // that used to read as slate now renders as a warm espresso-brown scale.
        coffee: {
          50: '#f7f2ed', 100: '#eee0d3', 200: '#e3c8b0', 300: '#d8ad88',
          400: '#cc905c', 500: '#b4743c', 600: '#8c5b31', 700: '#654325',
          800: '#462f1b', 900: '#2f2013', 950: '#21170e',
        },
        // Secondary accent (tabs, icon glows, borders, badges) — replaces the old blue.
        primary: {
          50: '#fbf3e7', 100: '#f5e3c7', 200: '#eccd9c', 300: '#e0b06d',
          400: '#d3944a', 500: '#c17f35', 600: '#a3672a', 700: '#805223',
          800: '#63401e', 900: '#4d321a', 950: '#2c1c0f',
        },
        // Paired with primary in gradients (logo, avatars, progress bars).
        accent: {
          50: '#fdf1ec', 100: '#fbdccc', 200: '#f5b899', 300: '#ec8f66',
          400: '#dd6c42', 500: '#c1532e', 600: '#9c4224', 700: '#7a341e',
          800: '#5c281a', 900: '#472014', 950: '#28120a',
        },
      },
    },
  },
  plugins: [],
};
