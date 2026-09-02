import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf-8"),
);

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
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
            /\/(status|password|login)-(block|release|reset|change|new|bycode)$/,
            "/$1:$2",
          );

          rewritten = rewritten.replace(
            /\/execute-test(\?|$)/,
            "/execute:test$1",
          );
          rewritten = rewritten.replace(
            /\/obtener-byGrupo(\?|$)/,
            "/obtener:byGrupo$1",
          );
          rewritten = rewritten.replace(
            /\/cadenavalor-actualizar(\?|$)/,
            "/cadenavalor:actualizar$1",
          );

          return rewritten;
        },
      },
    },
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
});
