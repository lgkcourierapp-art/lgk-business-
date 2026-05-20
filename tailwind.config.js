/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#D4FF00',
        'bg-primary': '#0A0A0A',
        'bg-secondary': '#1A1A1A',
        'bg-card': '#1A1A1A',
        border: '#333333',
        success: '#00C853',
        warning: '#FF9500',
        danger: '#FF3B30',
        info: '#007BFF',
      },
    },
  },
  plugins: [],
}
