#!/usr/bin/env node
import readline from "node:readline";
import { estado, sincronizar, publicar } from "../../../scripts/publicar.mjs";

const send = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");
const log = (...a) => process.stderr.write("[publicar-mcp] " + a.join(" ") + "\n");

const TOOLS = [
  {
    name: "repos_estado",
    description:
      "Muestra la rama actual, si hay cambios sin commitear, si la rama actual está al día con GitHub y cómo están dev y main en GitHub y en Devinline (iguales, atrás, adelante o con historiales distintos). No modifica nada.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "repos_sincronizar",
    description:
      "Copia dev y main al repo que esté atrás (GitHub o Devinline). Solo avanza ramas, nunca fuerza: si los historiales son distintos, frena y avisa.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "repos_publicar",
    description:
      "Publica la rama actual: exige que no haya cambios sin commitear, trae dev, corre lint y build y, si pasan, sube la rama a GitHub (las ramas de trabajo no van a Devinline). Con mergear_dev=true también actualiza dev en GitHub y en Devinline con esa rama. Nunca fuerza.",
    inputSchema: {
      type: "object",
      properties: {
        mergear_dev: {
          type: "boolean",
          description: "Si es true, después de subir la rama actualiza dev en los dos repos.",
        },
      },
      additionalProperties: false,
    },
  },
];

const handlers = {
  repos_estado: () => estado(),
  repos_sincronizar: () => sincronizar(),
  repos_publicar: ({ mergear_dev }) => publicar({ mergearDev: Boolean(mergear_dev) }),
};

const rl = readline.createInterface({ input: process.stdin });
rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    return;
  }
  const { id, method, params } = msg;

  try {
    if (method === "initialize") {
      send({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: params?.protocolVersion || "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "publicar", version: "1.0.0" },
        },
      });
    } else if (method === "notifications/initialized" || method === "notifications/cancelled") {
      return;
    } else if (method === "tools/list") {
      send({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
    } else if (method === "tools/call") {
      const fn = handlers[params?.name];
      if (!fn) {
        send({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: `Herramienta desconocida: ${params?.name}` }], isError: true },
        });
        return;
      }
      try {
        const texto = await fn(params.arguments || {});
        send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: texto }] } });
      } catch (e) {
        send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true } });
      }
    } else if (method === "ping") {
      send({ jsonrpc: "2.0", id, result: {} });
    } else if (id !== undefined) {
      send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Método no soportado: ${method}` } });
    }
  } catch (e) {
    log("error en", method, ":", e.message);
    if (id !== undefined) send({ jsonrpc: "2.0", id, error: { code: -32603, message: e.message } });
  }
});

log("arrancado.");
