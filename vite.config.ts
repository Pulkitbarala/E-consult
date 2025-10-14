import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Proxy requests to Supabase Functions during development to avoid CORS issues
    proxy: {
      // Proxy any /functions/* request to your Supabase project functions endpoint
      // Replace target with your SUPABASE_URL if different
      '/functions': {
        target: 'https://kylrkuwujlvankuwqqdc.supabase.co',
        changeOrigin: true,
        secure: true,
      },
      '/predict': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
