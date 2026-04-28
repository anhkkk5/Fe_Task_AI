import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Modern browsers only — skips polyfills, smaller bundle.
    target: "es2020",
    // Inline tiny assets (<4KB) to save round-trips.
    assetsInlineLimit: 4096,
    // Drop console.* and debugger in prod — smaller bundle, faster parse.
    minify: "esbuild",
    cssMinify: true,
    sourcemap: false,
    // Split heavy vendor libs into separate chunks so the initial page load
    // doesn't pull antd (~500KB) when the user only sees the login screen.
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "redux-vendor": ["@reduxjs/toolkit", "react-redux", "redux"],
          "antd-vendor": ["antd", "@ant-design/icons"],
          "markdown-vendor": ["react-markdown", "remark-gfm", "rehype-raw"],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
});
