import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa-icon.svg", "mask-icon.svg", "vite.svg"],
      manifest: {
        name: "Easy VCF Editor",
        short_name: "VCF Editor",
        description: "Offline-first editor for vCard (.vcf) contacts.",
        theme_color: "#020617",
        background_color: "#020617",
        display: "standalone",
        start_url: "/",
        scope: "/",
        orientation: "portrait-primary",
        icons: [
          {
            src: "/pwa-icon.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "/pwa-icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      devOptions: {
        enabled: true,
        suppressWarnings: true,
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
