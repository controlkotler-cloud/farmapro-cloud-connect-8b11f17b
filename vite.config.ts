import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { Plugin } from "vite";

// React Grab: solo en local con `npm run dev:grab` (no en build ni en la vista previa de Lovable).
const reactGrab = (): Plugin => ({
  name: "react-grab-local",
  apply: "serve",
  transformIndexHtml: () => [
    {
      tag: "script",
      attrs: { src: "https://unpkg.com/react-grab@0.2.0/dist/index.global.js", crossorigin: "anonymous" },
      injectTo: "head-prepend",
    },
  ],
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    process.env.REACT_GRAB === "1" && reactGrab(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
