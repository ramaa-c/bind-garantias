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
        rewrite: (path) => {
          let rewritten = path.replace(/^\/proxy-backend/, "");

          rewritten = rewritten.replace(/\/(byencrypt|pornombre)$/, "/:$1");

          rewritten = rewritten.replace(
            /\/(status|password)-(block|release|reset|change|new)$/,
            "/$1:$2",
          );

          return rewritten;
        },
      },
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
});
