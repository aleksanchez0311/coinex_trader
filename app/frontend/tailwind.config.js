/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fondo Principal - Eerie Black
        background: '#0B0E11',
        // Superficies/Tarjetas - Gunmetal
        surface: '#1E2329',
        surfaceElevated: '#252B35',
        surfaceHighlight: '#2B3139',
        // Bordes
        border: '#2B3139',
        borderLight: '#3D4654',
        // Acción Positiva (Long) - Emerald Green
        long: '#00C076',
        longMuted: '#009A5E',
        longBg: 'rgba(0, 192, 118, 0.1)',
        // Acción Negativa (Short) - Candy Apple Red  
        short: '#CF304A',
        shortMuted: '#A82838',
        shortBg: 'rgba(207, 48, 74, 0.1)',
        // Acento/neutral - Slate Gray
        neutral: '#848E9C',
        neutralMuted: '#5C6678',
        neutralBg: 'rgba(132, 142, 156, 0.1)',
        // Texto Primario - Anti-Flash White
        textPrimary: '#EAECEF',
        textSecondary: '#848E9C',
        textMuted: '#5C6678',
        // Acentos especiales
        accent: '#00C076',
        warning: '#F0B90B',
      },
      fontSize: {
        '2xs': '0.625rem',
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        'price': '1.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'Geist Sans', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'JetBrains Mono', 'monospace'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.5)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'elevated': '0 4px 16px rgba(0, 0, 0, 0.4)',
        'glow-long': '0 0 20px rgba(0, 192, 118, 0.3)',
        'glow-short': '0 0 20px rgba(207, 48, 74, 0.3)',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 100%)',
      },
      borderRadius: {
        ' DEFAULT': '8px',
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      spacing: {
        'card': '20px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 192, 118, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 192, 118, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}