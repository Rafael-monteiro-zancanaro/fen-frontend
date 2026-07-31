/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        uem: {
          primary: '#7f384a',
          'primary-dark': '#662d3b',
          'primary-light': '#9a4a5e',
          dark: '#333333',
          white: '#fafafa',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
