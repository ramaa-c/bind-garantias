# MCP de Plane

Servidor MCP para conectar Claude Code con el Plane del proyecto
(self-hosted, workspace `devinline`, proyecto "SGRPlus Web"). Permite leer
tickets/comentarios/módulos y crear/actualizar tickets, comentarios y
módulos desde el chat.

Node puro, sin dependencias (usa el `fetch` nativo de Node 18+). No hace
falta `npm install`.

## Setup (una vez por persona)

1. En Plane: avatar (arriba a la derecha) → Configuración → **API Tokens** →
   crear uno. Se muestra una sola vez, copialo.

2. Poné el token en una variable de entorno de tu sistema llamada
   `PLANE_API_TOKEN`:

   **Windows (PowerShell, permanente):**
   ```
   setx PLANE_API_TOKEN "plane_api_xxxxxxxxxxxx"
   ```
   Cerrá y reabrí la terminal (y Claude Code) para que la tome.

   **Linux/Mac:** agregá `export PLANE_API_TOKEN="plane_api_xxxx"` a tu
   `~/.bashrc` / `~/.zshrc`.

3. Abrí el proyecto en Claude Code. La primera vez te va a pedir aprobar el
   servidor MCP del proyecto (`.mcp.json`) — aceptá.

Listo. El archivo `server.mjs` viene con el `git pull`; lo único propio de
cada uno es la variable de entorno con el token.

## Config opcional

Todo tiene default para este proyecto. Solo si hiciera falta apuntar a otra
instancia/proyecto, se pueden setear también:

| Variable | Default |
|---|---|
| `PLANE_BASE_URL` | `https://plane.devinline.com.ar/api/v1` |
| `PLANE_WORKSPACE` | `devinline` |
| `PLANE_PROJECT` | UUID de "SGRPlus Web" |

## Herramientas

- `plane_get_issue` — ticket por código (`SGRPLUSPLA-186` o `186`)
- `plane_list_issues` — lista con filtro por estado y/o texto
- `plane_get_comments` / `plane_add_comment`
- `plane_create_issue` / `plane_update_issue` (estado, prioridad, título,
  descripción, etiquetas, asignados)
- `plane_list_modules` / `plane_create_module`
- `plane_assign_module` / `plane_unassign_module` — para marcar en qué
  versión (Front/API) sale cada cambio

Toda escritura pide aprobación en el momento.
