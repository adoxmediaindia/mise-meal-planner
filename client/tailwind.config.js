/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#fafaf8',
        surface: '#ffffff',
        primary: {
          DEFAULT: '#9ed034',
          dark: '#8bc020',
          tint: 'rgba(158, 208, 52, 0.16)',
        },
        phone: '#1a1a1a',
        charcoal: '#2a2a2a',
        muted: {
          DEFAULT: '#6b6b6b',
          light: '#9a9a94',
        },
        listBubble: '#ddf4ff',
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'Times', 'serif'],
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: '24px',
        sm: '16px',
        phone: '46px',
      },
      boxShadow: {
        sm: '0 4px 16px rgba(42, 42, 42, 0.06)',
        md: '0 12px 32px rgba(42, 42, 42, 0.10)',
        lg: '0 24px 60px rgba(42, 42, 42, 0.14)',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'marquee': 'scroll-x 32s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'scroll-x': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
