import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  envPrefix: ['VITE_', 'SUPABASE_', 'META_', 'EMAILJS_', 'LETTER_'],
  base: "/", // Changed from "./" to "/"
  build: {
    outDir: "dist",
  },
})