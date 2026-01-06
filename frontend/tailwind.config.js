/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // O PULO DO GATO: Aponta para TUDO dentro da pasta src
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  
  darkMode: 'class', 

  theme: {
    extend: {
      colors: {
        // Isso vai fazer os pontos do mapa aparecerem
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7', // Usado nos marcadores
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}