/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        glass: {
          surface: 'var(--glass-surface)',
          strong: 'var(--glass-surface-strong)',
          stroke: 'var(--glass-stroke)',
          highlight: 'var(--glass-highlight)'
        },
        aurora: {
          mint: '#5eead4',
          sky: '#38bdf8',
          amber: '#f59e0b'
        }
      },
      borderRadius: {
        glass: '20px'
      },
      boxShadow: {
        glass: 'var(--glass-shadow)',
        'glass-glow': 'var(--glass-shadow), 0 0 40px var(--glass-glow)'
      }
    },
  },
  plugins: [],
} 
