import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true, // ? Ini yang membuat Vite bisa diakses via IP lokal
        port: 5173, // Port tetap 5173
        strictPort: true
    }
})