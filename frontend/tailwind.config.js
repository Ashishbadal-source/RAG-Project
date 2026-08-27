/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        card: '#111827',
        cardHover: '#1F2937',
        border: '#374151',
        accent: {
          DEFAULT: '#3B82F6',
          hover: '#60A5FA',
          gradientStart: '#3B82F6',
          gradientEnd: '#06B6D4',
        },
        muted: '#9CA3AF',
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'glow': '0 0 15px rgba(59, 130, 246, 0.5)',
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
