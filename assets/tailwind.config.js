/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './*.html',
    './assets/js/**/*.js',
  ],
  safelist: [
    'animate-fade-in',
    'animate-slide-up',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef4fb',
          100: '#d7e5f5',
          200: '#b3cceb',
          300: '#84acdc',
          400: '#5285c9',
          500: '#3366b2',
          600: '#254e91',
          700: '#1e3f76',
          800: '#132a54',
          900: '#0b1c3a',
          950: '#071026',
        },
        gold: {
          50: '#fdf9ec',
          100: '#faf0cb',
          200: '#f4dd93',
          300: '#edc55b',
          400: '#e6ac36',
          500: '#d79a1f',
          600: '#b87817',
          700: '#935917',
          800: '#794719',
          900: '#673c1a',
        },
      },
      fontFamily: {
        display: ['"Poppins"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out both',
        'slide-up': 'slideUp 0.7s ease-out both',
        marquee: 'marquee 30s linear infinite',
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(11, 28, 58, 0.25)',
        card: '0 4px 20px rgba(11, 28, 58, 0.08)',
      },
      backgroundImage: {
        'hero-pattern': "radial-gradient(circle at top right, rgba(215,154,31,0.25), transparent 45%), radial-gradient(circle at bottom left, rgba(51,102,178,0.35), transparent 50%)",
      },
    },
  },
  plugins: [],
}
