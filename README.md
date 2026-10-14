# SGRPlusWebFront

Front para Plataforma Web SGRPlus-Bind.

## Puesta en marcha

1. `npm install`
2. Copiar `.env.example` a `.env`.
3. Copiar `.mcp.json.example` a `.mcp.json` si usás Claude Code.
4. `npm run dev`

`CLAUDE.md`, `.mcp.json`, `.env` y los `web.test-*.config` son archivos locales de cada uno y no se suben al repo.

## Repositorios

El código vive en GitHub. Devinline es una copia de `dev` y `main` para que el equipo de backend pueda consultar el front; las ramas de trabajo (`feature-*`) se suben solo a GitHub.

| Remoto | Repo |
|---|---|
| `origin` | GitHub `ramaa-c/bind-garantias` |
| `devinline` | Devinline `Devinline/SGRPlusWebFront` |

No hagas `git push` a mano: usá los comandos de abajo, que mantienen los dos repos iguales y nunca fuerzan.

| Comando | Qué hace |
|---|---|
| `npm run publicar` | Exige que no haya cambios sin commitear, trae `dev` a tu rama, corre lint y build y, si pasan, sube tu rama a GitHub. |
| `npm run publicar -- --dev` | Lo mismo y además actualiza `dev` en GitHub y en Devinline con tu rama. |
| `npm run publicar:estado` | Muestra si tu rama está al día con GitHub y cómo están `dev` y `main` en cada repo. No modifica nada. |
| `npm run publicar:sincronizar` | Copia `dev` y `main` al repo que esté atrás, por ejemplo después de mergear un PR en GitHub. |

Si el remoto `devinline` no existe, el script lo agrega solo. Si algún repo tiene commits que el otro no tiene, el script frena y avisa en vez de pisar nada.

Desde Claude Code están las mismas acciones como herramientas del MCP `publicar`: `repos_estado`, `repos_sincronizar` y `repos_publicar`.
