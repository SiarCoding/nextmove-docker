import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@db": path.resolve(__dirname, "../server/db"),
    },
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || 'http://localhost:10000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
  },
});