export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './electron/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        parliament: {
          gold: '#C9A84C',
          'gold-light': '#E8D08A',
          'gold-dark': '#8B6914',
          navy: '#1A2B4C',
          'navy-dark': '#0F1A2E',
          'navy-light': '#243655',
          ivory: '#F5F2EB',
          'ivory-dark': '#E8E3D6',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glass-light': '0 4px 20px rgba(255, 255, 255, 0.08)',
        'glass-lg': '0 8px 40px rgba(0, 0, 0, 0.15)',
        'gold-glow': '0 0 20px rgba(201, 168, 76, 0.3)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C9A84C 0%, #8B6914 100%)',
        'navy-gradient': 'linear-gradient(180deg, #1A2B4C 0%, #0F1A2E 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
        'glass-shimmer': 'glassShimmer 3s ease infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        glassShimmer: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
      },
    },
  },
  plugins: [],
};