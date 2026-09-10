#!/usr/bin/env node
// MCP server para Plane (self-hosted). Sin dependencias: habla JSON-RPC 2.0
// por stdin/stdout con mensajes delimitados por newline, y usa el fetch
// nativo de Node 18+.
//
// Config por variables de entorno (se setean en la config del MCP):
//   PLANE_API_TOKEN   (obligatorio)  token personal de Plane
//   PLANE_BASE_URL    default https://plane.devinline.com.ar/api/v1
//   PLANE_WORKSPACE   default devinline
//   PLANE_PROJECT     default <UUID de "SGRPlus Web">
//
// Herramientas: plane_get_issue, plane_list_issues, plane_get_comments,
// plane_add_comment.

import readline from "node:readline";

const TOKEN = process.env.PLANE_API_TOKEN;
const BASE = (process.env.PLANE_BASE_URL || "https://plane.devinline.com.ar/api/v1").replace(/\/$/, "");
const WS = process.env.PLANE_WORKSPACE || "devinline";
const PROJECT = process.env.PLANE_PROJECT || "de6cd926-310e-4a1b-b9d3-2942f95d55f2";

const send = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");
const log = (...a) => process.stderr.write("[plane-mcp] " + a.join(" ") + "\n");

// ── HTTP ────────────────────────────────────────────────────────────────
const api = async (path, { method = "GET", body } = {}) => {
  if (!TOKEN) throw new Error("Falta PLANE_API_TOKEN en la config del MCP.");
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "X-API-Key": TOKEN, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* deja json en null */ }
  if (!res.ok) {
    const detalle = json ? JSON.stringify(json) : text.slice(0, 300);
    throw new Error(`Plane respondió ${res.status}: ${detalle}`);
  }
  return json;
};

const wsPath = (p) => `/workspaces/${WS}${p}`;
const projPath = (p) => `/workspaces/${WS}/projects/${PROJECT}${p}`;

// ── Catálogos (se cachean una vez por proceso) ──────────────────────────
let _cat = null;
const catalogos = async () => {
  if (_cat) return _cat;
  const [statesRes, membersRes, labelsRes, projRes] = await Promise.all([
    api(projPath("/states/")),
    api(wsPath("/members/")),
    api(projPath("/labels/")),
    api(`/workspaces/${WS}/projects/${PROJECT}/`),
  ]);
  const arr = (r) => r?.results || (Array.isArray(r) ? r : []);
  const states = new Map(arr(statesRes).map((s) => [s.id, s]));
  const members = new Map(
    arr(membersRes).map((m) => {
      const mm = m.member || m;
      return [mm.id, mm.display_name || mm.email || mm.id];
    }),
  );
  const labels = new Map(arr(labelsRes).map((l) => [l.id, l.name]));
  _cat = { states, members, labels, identifier: projRes?.identifier || "" };
  return _cat;
};

// ── Issues: se trae la lista completa (paginada) y se cachea 60s ────────
let _issues = { at: 0, data: [] };
const todasLasIssues = async () => {
  if (Date.now() - _issues.at < 60_000 && _issues.data.length) return _issues.data;
  let all = [];
  let cursor = null;
  for (let i = 0; i < 20; i++) {
    const qs = `?per_page=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const page = await api(projPath(`/issues/${qs}`));
    all = all.concat(page?.results || []);
    if (!page?.next_page_results) break;
    cursor = page.next_cursor;
  }
  _issues = { at: Date.now(), data: all };
  return all;
};

const bustCacheIssues = () => { _issues = { at: 0, data: [] }; };

// ── Módulos: se usan para marcar en qué versión sale cada cambio ────────
// (ej. "Versión Front 1.14.24", "Versión API 1.9.18"). Se indexa qué issues
// tiene cada módulo — cache aparte, lazy, 60s.
let _mods = { at: 0, list: [], porModulo: new Map() };
const indiceModulos = async () => {
  if (Date.now() - _mods.at < 60_000 && _mods.list.length) return _mods;
  const res = await api(projPath("/modules/"));
  const list = (res?.results || (Array.isArray(res) ? res : [])).map((m) => ({ id: m.id, name: m.name }));
  const porModulo = new Map();
  await Promise.all(
    list.map(async (m) => {
      try {
        const mi = await api(projPath(`/modules/${m.id}/module-issues/`));
        const issues = (mi?.results || (Array.isArray(mi) ? mi : [])).map((x) => x.id || x.issue);
        porModulo.set(m.id, new Set(issues));
      } catch {
        porModulo.set(m.id, new Set());
      }
    }),
  );
  _mods = { at: Date.now(), list, porModulo };
  return _mods;
};
const bustCacheModulos = () => { _mods = { at: 0, list: [], porModulo: new Map() }; };

const modulosDeIssue = (mods, issueId) =>
  mods.list.filter((m) => mods.porModulo.get(m.id)?.has(issueId)).map((m) => m.name);

const resolverModulo = (mods, nombre) => {
  const objetivo = String(nombre).trim().toLowerCase();
  const m = mods.list.find((x) => x.name.toLowerCase() === objetivo);
  if (!m) throw new Error(`No existe el módulo "${nombre}". Existentes: ${mods.list.map((x) => x.name).join(", ")}.`);
  return m;
};

// "SGRPLUSPLA-186", "sgrpluspla-186", "186", "#186" -> 186
const parseSecuencia = (identifier) => {
  const m = String(identifier).match(/(\d+)\s*$/);
  if (!m) throw new Error(`No pude interpretar el código de ticket "${identifier}".`);
  return Number(m[1]);
};

const buscarIssue = async (identifier) => {
  const seq = parseSecuencia(identifier);
  const it = (await todasLasIssues()).find((x) => x.sequence_id === seq);
  if (!it) throw new Error(`No encontré el ticket ${identifier} en el proyecto.`);
  return it;
};

// name (case-insensitive) -> id, buscando en un Map<id,name|obj>
const resolverPorNombre = (mapa, nombre, queEs) => {
  if (nombre == null || nombre === "") return null;
  const objetivo = String(nombre).trim().toLowerCase();
  for (const [id, val] of mapa) {
    const label = typeof val === "string" ? val : val?.name;
    if ((label || "").toLowerCase() === objetivo) return id;
  }
  const opciones = [...mapa.values()].map((v) => (typeof v === "string" ? v : v?.name)).filter(Boolean);
  throw new Error(`No existe ${queEs} "${nombre}". Opciones: ${opciones.join(", ")}.`);
};

const PRIORIDADES = ["urgent", "high", "medium", "low", "none"];

// ── Texto ──────────────────────────────────────────────────────────────
const htmlAtexto = (html) => {
  if (!html) return "";
  return String(html)
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "\n- ")
    .replace(/<image-component[^>]*>/gi, "[imagen]")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

// texto plano -> HTML mínimo (Plane guarda descripciones/comentarios en HTML)
const textoAhtml = (texto) => {
  const escapado = String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escapado
    .split(/\n{2,}/)
    .map((parrafo) => `<p>${parrafo.replace(/\n/g, "<br>")}</p>`)
    .join("");
};

const urlIssue = (it, cat) => {
  const web = BASE.replace(/\/api\/v1$/, "");
  return `${web}/${WS}/projects/${PROJECT}/issues/${it.id}`;
};

const formatearIssue = (it, cat, modulos = []) => {
  const cod = cat.identifier ? `${cat.identifier}-${it.sequence_id}` : `#${it.sequence_id}`;
  const estado = cat.states.get(it.state)?.name || "?";
  const asignados = (it.assignees || []).map((a) => cat.members.get(a) || a).join(", ") || "(sin asignar)";
  const etiquetas = (it.labels || []).map((l) => cat.labels.get(l) || l).join(", ") || "(ninguna)";
  return [
    `${cod}  —  ${it.name}`,
    `Estado: ${estado}`,
    `Prioridad: ${it.priority || "none"}`,
    `Asignado a: ${asignados}`,
    `Etiquetas: ${etiquetas}`,
    `Módulos (versión): ${modulos.length ? modulos.join(", ") : "(ninguno)"}`,
    it.target_date ? `Fecha objetivo: ${it.target_date}` : null,
    `Creado: ${it.created_at}   Actualizado: ${it.updated_at}`,
    `URL: ${urlIssue(it, cat)}`,
    ``,
    `Descripción:`,
    htmlAtexto(it.description_html) || "(vacía)",
  ]
    .filter((l) => l !== null)
    .join("\n");
};

// ── Herramientas ───────────────────────────────────────────────────────
const TOOLS = [
  {
    name: "plane_get_issue",
    description:
      "Trae un ticket de Plane por su código (ej. \"SGRPLUSPLA-186\", \"186\" o \"#186\"): título, estado, asignados, etiquetas y descripción completa.",
    inputSchema: {
      type: "object",
      properties: { identifier: { type: "string", description: "Código del ticket, ej. SGRPLUSPLA-186 o 186" } },
      required: ["identifier"],
    },
  },
  {
    name: "plane_list_issues",
    description:
      "Lista tickets del proyecto en formato compacto (código, título, estado). Filtros opcionales por estado y por texto en el título.",
    inputSchema: {
      type: "object",
      properties: {
        state: { type: "string", description: "Nombre del estado, ej. \"In Progress\", \"Backlog\", \"Done\", \"Resuelto Ok\". Case-insensitive." },
        search: { type: "string", description: "Substring a buscar en el título del ticket." },
        limit: { type: "number", description: "Máximo de tickets a devolver (default 30)." },
      },
    },
  },
  {
    name: "plane_get_comments",
    description: "Trae los comentarios de un ticket de Plane (autor, texto y fecha), en orden cronológico.",
    inputSchema: {
      type: "object",
      properties: { identifier: { type: "string", description: "Código del ticket, ej. SGRPLUSPLA-186 o 186" } },
      required: ["identifier"],
    },
  },
  {
    name: "plane_add_comment",
    description:
      "Publica un comentario en un ticket de Plane. Úsalo solo cuando el usuario lo pida explícitamente: es una escritura visible para todo el equipo.",
    inputSchema: {
      type: "object",
      properties: {
        identifier: { type: "string", description: "Código del ticket, ej. SGRPLUSPLA-186 o 186" },
        text: { type: "string", description: "Texto del comentario (texto plano; se envía como un párrafo)." },
      },
      required: ["identifier", "text"],
    },
  },
  {
    name: "plane_create_issue",
    description:
      "Crea un ticket nuevo en el proyecto. Úsalo solo cuando el usuario lo pida explícitamente. Devuelve el código (ej. SGRPLUSPLA-NNN) y la URL.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Título del ticket." },
        description: { type: "string", description: "Descripción (texto plano; los saltos de línea se respetan). Opcional." },
        state: { type: "string", description: "Estado inicial por nombre: Backlog, Todo, In Progress, Done, Resuelto Ok, Con Observaciones, Cancelled. Opcional (default el del proyecto)." },
        priority: { type: "string", description: "Prioridad: urgent | high | medium | low | none. Opcional (default none)." },
        labels: { type: "array", items: { type: "string" }, description: "Nombres de etiquetas a poner, ej. [\"Bug detected\", \"En entorno Desarrollo\"]. Opcional." },
        assignees: { type: "array", items: { type: "string" }, description: "Nombres de usuarios a asignar (display_name de Plane). Opcional." },
      },
      required: ["title"],
    },
  },
  {
    name: "plane_update_issue",
    description:
      "Modifica un ticket existente (estado, prioridad, título, descripción, etiquetas, asignados). Úsalo solo cuando el usuario lo pida. Solo se cambia lo que mandes.",
    inputSchema: {
      type: "object",
      properties: {
        identifier: { type: "string", description: "Código del ticket, ej. SGRPLUSPLA-186 o 186" },
        state: { type: "string", description: "Nuevo estado por nombre. Opcional." },
        priority: { type: "string", description: "Nueva prioridad: urgent | high | medium | low | none. Opcional." },
        title: { type: "string", description: "Nuevo título. Opcional." },
        description: { type: "string", description: "Nueva descripción (texto plano, reemplaza la actual). Opcional." },
        labels: { type: "array", items: { type: "string" }, description: "Nombres de etiquetas — REEMPLAZA la lista actual completa. Opcional." },
        assignees: { type: "array", items: { type: "string" }, description: "Nombres de usuarios — REEMPLAZA la lista actual completa. Opcional." },
      },
      required: ["identifier"],
    },
  },
  {
    name: "plane_list_modules",
    description:
      "Lista los módulos del proyecto. Se usan para marcar en qué versión (Front/API) sale cada cambio, ej. \"Versión Front 1.14.24\".",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "plane_create_module",
    description:
      "Crea un módulo nuevo (ej. una versión: \"Versión Front 1.14.25\"). Úsalo solo cuando el usuario lo pida.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nombre del módulo, ej. \"Versión Front 1.14.25\" o \"Versión API 1.9.19\"." },
        description: { type: "string", description: "Descripción. Opcional." },
        target_date: { type: "string", description: "Fecha objetivo YYYY-MM-DD. Opcional." },
      },
      required: ["name"],
    },
  },
  {
    name: "plane_assign_module",
    description:
      "Agrega uno o más tickets a un módulo (ej. marcar que salen en \"Versión Front 1.14.24\"). Úsalo solo cuando el usuario lo pida.",
    inputSchema: {
      type: "object",
      properties: {
        module: { type: "string", description: "Nombre exacto del módulo destino." },
        identifiers: {
          type: "array",
          items: { type: "string" },
          description: "Códigos de ticket a agregar al módulo, ej. [\"SGRPLUSPLA-186\", \"190\"].",
        },
      },
      required: ["module", "identifiers"],
    },
  },
  {
    name: "plane_unassign_module",
    description: "Saca un ticket de un módulo. Úsalo solo cuando el usuario lo pida.",
    inputSchema: {
      type: "object",
      properties: {
        module: { type: "string", description: "Nombre exacto del módulo." },
        identifier: { type: "string", description: "Código del ticket a sacar, ej. SGRPLUSPLA-186." },
      },
      required: ["module", "identifier"],
    },
  },
];

const handlers = {
  async plane_get_issue({ identifier }) {
    const cat = await catalogos();
    const it = await buscarIssue(identifier);
    let mods = [];
    try { mods = modulosDeIssue(await indiceModulos(), it.id); } catch { /* si falla, se omite */ }
    return formatearIssue(it, cat, mods);
  },

  async plane_list_issues({ state, search, limit }) {
    const cat = await catalogos();
    let list = await todasLasIssues();
    if (state) {
      const s = state.toLowerCase();
      list = list.filter((it) => (cat.states.get(it.state)?.name || "").toLowerCase() === s);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((it) => (it.name || "").toLowerCase().includes(q));
    }
    list.sort((a, b) => b.sequence_id - a.sequence_id);
    const max = Number.isFinite(limit) && limit > 0 ? limit : 30;
    const recortada = list.slice(0, max);
    if (!recortada.length) return "No hay tickets que coincidan con ese filtro.";
    const lineas = recortada.map((it) => {
      const cod = cat.identifier ? `${cat.identifier}-${it.sequence_id}` : `#${it.sequence_id}`;
      const est = cat.states.get(it.state)?.name || "?";
      return `${cod}  [${est}]  ${it.name}`;
    });
    const extra = list.length > recortada.length ? `\n… y ${list.length - recortada.length} más (subí "limit" para ver el resto).` : "";
    return `${recortada.length} de ${list.length} tickets:\n\n${lineas.join("\n")}${extra}`;
  },

  async plane_get_comments({ identifier }) {
    const cat = await catalogos();
    const it = await buscarIssue(identifier);
    const res = await api(projPath(`/issues/${it.id}/comments/`));
    const arr = res?.results || (Array.isArray(res) ? res : []);
    if (!arr.length) return `El ticket ${identifier} no tiene comentarios.`;
    arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return arr
      .map((c) => {
        const autor = cat.members.get(c.actor) || c.actor || "?";
        const cuerpo = htmlAtexto(c.comment_html) || c.comment_stripped || "(vacío)";
        return `[${c.created_at}] ${autor}:\n${cuerpo}`;
      })
      .join("\n\n---\n\n");
  },

  async plane_add_comment({ identifier, text }) {
    const it = await buscarIssue(identifier);
    await api(projPath(`/issues/${it.id}/comments/`), {
      method: "POST",
      body: { comment_html: textoAhtml(text) },
    });
    return `Comentario publicado en ${identifier}.`;
  },

  async plane_create_issue({ title, description, state, priority, labels, assignees }) {
    const cat = await catalogos();
    const body = { name: String(title) };
    if (description) body.description_html = textoAhtml(description);
    if (state) body.state = resolverPorNombre(cat.states, state, "el estado");
    if (priority) {
      if (!PRIORIDADES.includes(priority)) throw new Error(`Prioridad inválida "${priority}". Usá: ${PRIORIDADES.join(", ")}.`);
      body.priority = priority;
    }
    if (Array.isArray(labels) && labels.length)
      body.labels = labels.map((l) => resolverPorNombre(cat.labels, l, "la etiqueta"));
    if (Array.isArray(assignees) && assignees.length)
      body.assignees = assignees.map((a) => resolverPorNombre(cat.members, a, "el usuario"));

    const nuevo = await api(projPath(`/issues/`), { method: "POST", body });
    bustCacheIssues();
    const cod = cat.identifier ? `${cat.identifier}-${nuevo.sequence_id}` : `#${nuevo.sequence_id}`;
    return `Ticket creado: ${cod}\n${nuevo.name}\nURL: ${urlIssue(nuevo, cat)}`;
  },

  async plane_update_issue({ identifier, state, priority, title, description, labels, assignees }) {
    const cat = await catalogos();
    const it = await buscarIssue(identifier);
    const body = {};
    if (title != null) body.name = String(title);
    if (description != null) body.description_html = textoAhtml(description);
    if (state) body.state = resolverPorNombre(cat.states, state, "el estado");
    if (priority) {
      if (!PRIORIDADES.includes(priority)) throw new Error(`Prioridad inválida "${priority}". Usá: ${PRIORIDADES.join(", ")}.`);
      body.priority = priority;
    }
    if (Array.isArray(labels)) body.labels = labels.map((l) => resolverPorNombre(cat.labels, l, "la etiqueta"));
    if (Array.isArray(assignees)) body.assignees = assignees.map((a) => resolverPorNombre(cat.members, a, "el usuario"));
    if (!Object.keys(body).length) throw new Error("No mandaste ningún campo para cambiar.");

    await api(projPath(`/issues/${it.id}/`), { method: "PATCH", body });
    bustCacheIssues();
    const cod = cat.identifier ? `${cat.identifier}-${it.sequence_id}` : `#${it.sequence_id}`;
    return `Ticket ${cod} actualizado (${Object.keys(body).join(", ")}).`;
  },

  async plane_list_modules() {
    const mods = await indiceModulos();
    if (!mods.list.length) return "El proyecto no tiene módulos.";
    return mods.list
      .map((m) => `- ${m.name}  (${mods.porModulo.get(m.id)?.size ?? 0} tickets)`)
      .join("\n");
  },

  async plane_create_module({ name, description, target_date }) {
    const body = { name: String(name) };
    if (description) body.description = String(description);
    if (target_date) body.target_date = target_date;
    const nuevo = await api(projPath(`/modules/`), { method: "POST", body });
    bustCacheModulos();
    return `Módulo creado: "${nuevo.name}".`;
  },

  async plane_assign_module({ module, identifiers }) {
    const mods = await indiceModulos();
    const m = resolverModulo(mods, module);
    const ids = [];
    for (const ident of identifiers) ids.push((await buscarIssue(ident)).id);
    await api(projPath(`/modules/${m.id}/module-issues/`), {
      method: "POST",
      body: { issues: ids },
    });
    bustCacheModulos();
    return `${ids.length} ticket(s) agregados al módulo "${m.name}".`;
  },

  async plane_unassign_module({ module, identifier }) {
    const mods = await indiceModulos();
    const m = resolverModulo(mods, module);
    const it = await buscarIssue(identifier);
    await api(projPath(`/modules/${m.id}/module-issues/${it.id}/`), { method: "DELETE" });
    bustCacheModulos();
    return `${identifier} sacado del módulo "${m.name}".`;
  },
};

// ── Loop JSON-RPC ──────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin });
rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg;
  try { msg = JSON.parse(trimmed); } catch { return; }
  const { id, method, params } = msg;

  try {
    if (method === "initialize") {
      send({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: params?.protocolVersion || "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "plane", version: "1.0.0" },
        },
      });
    } else if (method === "notifications/initialized" || method === "notifications/cancelled") {
      // notificaciones: sin respuesta
    } else if (method === "tools/list") {
      send({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
    } else if (method === "tools/call") {
      const fn = handlers[params?.name];
      if (!fn) {
        send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: `Herramienta desconocida: ${params?.name}` }], isError: true } });
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

log(`arrancado. base=${BASE} ws=${WS} proj=${PROJECT} token=${TOKEN ? "ok" : "FALTA"}`);
