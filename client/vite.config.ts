import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true
      },
      "/auth": {
        target: "http://localhost:3001",
        changeOrigin: true
      },
      "/aspsps": {
        target: "http://localhost:3001",
        changeOrigin: true
      },
      "/health": {
        target: "http://localhost:3001",
        changeOrigin: true
      },
      "/accounts": {
        target: "http://localhost:3001",
        changeOrigin: true
      },
      "/balance": {
        target: "http://localhost:3001",
        changeOrigin: true
      },
      "/transactions": {
        target: "http://localhost:3001",
        changeOrigin: true
      },
      "/sync": {
        target: "http://localhost:3001",
        changeOrigin: true
      }
    }
  }
});
