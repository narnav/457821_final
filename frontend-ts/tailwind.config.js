/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'bounce-arrow': 'bounceArrow 1.5s ease-in-out infinite',
        'draw-candle': 'drawCandle 1.2s ease-out forwards',
      },
      keyframes: {
        slideDown: {
          '0%': { opacity: '0', maxHeight: '0', padding: '0 1.25rem' },
          '100%': { opacity: '1', maxHeight: '500px', padding: '1.25rem' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.4)' },
          '50%': { boxShadow: '0 0 20px 10px rgba(99, 102, 241, 0.15)' },
        },
        bounceArrow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(12px)' },
        },
        drawCandle: {
          '0%': { transform: 'scaleY(0)', opacity: '0' },
          '100%': { transform: 'scaleY(1)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}
