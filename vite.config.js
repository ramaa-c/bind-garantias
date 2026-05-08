import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/proxy-backend": {
        target: "http://192.168.2.103:9988",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/proxy-backend/, ""),
      },
    },
  },
});