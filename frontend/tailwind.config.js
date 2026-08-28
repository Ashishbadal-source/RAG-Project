/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#E5E7EB',
        sidebar: '#0F172A',
        navbar: '#111827',
        card: '#F3F4F6',
        'card-elevated': '#E2E8F0',
        border: '#CBD5E1',
        'border-strong': '#94A3B8',
        'text-primary': '#000000',
        'text-secondary': '#334155',
        'text-muted': '#64748B',
        accent: {
          DEFAULT: '#06B6D4',
          hover: '#0891B2',
          teal: '#14B8A6',
          blue: '#0EA5E9',
        },
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px rgba(16, 185, 129, 0.1), 0 2px 4px rgba(14, 165, 233, 0.06)',
        'glow': '0 0 12px rgba(14, 165, 233, 0.3)',
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
