import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import electron from "vite-plugin-electron";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Electron builds/dev run with `--mode electron` (see the electron:* scripts).
  // Cross-platform and cross-env-free, unlike an env-var flag.
  const isElectron = mode === "electron";

  return {
    // Relative base is required so the packaged app can load assets over file://.
    base: isElectron ? "./" : "/",
    plugins: [
      react({
        babel: {
          plugins: [["babel-plugin-react-compiler"]],
        },
      }),
      tailwindcss(),
      VitePWA({
        registerType: "prompt",
        includeAssets: [
          "vcf.svg",
          "vcf-without-bg-black.svg",
          "vite.svg",
          "apple-touch-icon-180x180.png",
          "favicon.ico"
        ],
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
              src: "/pwa-64x64.png",
              sizes: "64x64",
              type: "image/png",
            },
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "/vcf.svg",
              sizes: "192x192",
              type: "image/svg+xml",
            },
            {
              src: "/vcf.svg",
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
        // The service worker is pointless inside a packaged desktop app.
        disable: isElectron,
      }),
      // Only build/launch Electron under `--mode electron`, so the plain web
      // `dev`/`build` scripts are untouched.
      ...(isElectron
        ? [
            electron([
              {
                // Main process — ESM output (package.json is "type":"module",
                // and Electron 38 supports an ESM main entry).
                entry: "electron/main.ts",
                onstart(args) {
                  args.startup();
                },
                vite: {
                  build: {
                    outDir: "dist-electron",
                    rollupOptions: {
                      output: {
                        format: "es",
                        entryFileNames: "main.js",
                      },
                    },
                  },
                },
              },
              {
                // Preload — MUST be CommonJS because the window uses
                // `sandbox: true`; sandboxed preloads cannot be ES modules.
                // The `.cjs` extension forces CJS under a "type":"module" package.
                entry: "electron/preload.ts",
                onstart(args) {
                  args.reload();
                },
                vite: {
                  build: {
                    outDir: "dist-electron",
                    rollupOptions: {
                      output: {
                        format: "cjs",
                        entryFileNames: "preload.cjs",
                      },
                    },
                  },
                },
              },
            ]),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      target: "esnext",
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (
                id.includes("react-dom") ||
                id.includes("react-hook-form") ||
                id.includes("jotai")
              ) {
                return "vendor-react-core";
              }
              if (id.includes("lucide-react")) {
                return "vendor-icons";
              }
              if (id.includes("@radix-ui")) {
                return "vendor-radix";
              }
              if (id.includes("vcard4") || id.includes("vcard-creator")) {
                return "vendor-vcard";
              }
              if (
                id.includes("countries-list") ||
                id.includes("html-to-image") ||
                id.includes("qrcode")
              ) {
                return "vendor-utils";
              }
              return "vendor-common";
            }
          },
        },
      },
    },
    server: {
      host: true,
      // Pinned so main.ts's dev `loadURL("http://localhost:5173")` can't drift.
      port: 5173,
      strictPort: true,
      allowedHosts: true,
    },
    preview: {
      host: true,
      port: 4173,
      strictPort: true,
      allowedHosts: true,
    },
  };
});
