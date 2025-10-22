/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.js', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 900: '#0F0F10', 800: '#1A1A1B', 700: '#222325' },
      },
      borderRadius: { xl2: '1rem' },
    },
  },
  corePlugins: require('tailwind-rn/unsupported-core-plugins'),
};
