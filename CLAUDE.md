# bind-garantias — Contexto del proyecto

Plataforma web para una SGR (Sociedad de Garantía Recíproca) de BIND. Permite el onboarding digital de empresas (legajo), la gestión de solicitudes de garantías/préstamos, y un panel de administración para configurar cadenas de valor, criterios de aceptación (CDAs), requisitos documentales y líneas de crédito.

## Equipo y flujo de trabajo

- **Frontend**: Mati (`feature-mati`) y Ramiro (`feature-rama`). Cada uno trabaja en su rama y se mergea a `dev` (por PR en GitHub o merge directo). `main` se actualiza aparte.
- **Backend**: Victor. El frontend NO puede modificar el backend; cualquier bug de API se le reporta a él.
- Antes de mergear a `dev`: correr `npm run lint` y `npm run build`. Después de mergear, traer `dev` de vuelta a la rama propia.

## Comandos

```bash
npm run dev      # Vite dev server (puerto 5173 por defecto)
npm run build    # Build de producción (esbuild dropea console/debugger)
npm run lint     # ESLint
```

No hay tests automatizados. La verificación es manual (levantar la app) + lint + build.

## Stack

- **React 19** + **Vite 7**, JSX plano (sin TypeScript)
- **react-router-dom v7** — routing
- **zustand** (con `persist`) — estado global (`src/store/`)
- **@tanstack/react-query** — data fetching (hooks en `src/hooks/`)
- **react-hook-form + zod** — formularios y validación (`src/schemas/`)
- **axios** — HTTP (instancia única en `src/api/axios.js`)
- **sonner** — toasts (`toast.success/error/info/loading`)
- **CSS Modules** — cada componente tiene su `.module.css` al lado
- Íconos: `react-icons` (mayormente `fi`)

## Estructura de carpetas

```
src/
├── api/axios.js        # Instancia axios: interceptor global + retry
├── adapters/           # Conversión de payloads frontend → backend (PascalCase)
├── services/           # Llamadas a la API, una por dominio (sociosService, cdaService, ...)
├── hooks/              # Hooks react-query que envuelven los services (useCda, useSocios, ...)
├── store/              # Zustand (useAuthStore, useNavigationStore)
├── schemas/            # Schemas zod para react-hook-form
├── utils/              # Helpers (normalizarClaves, direccionParser, fileUtils, ...)
├── context/            # ChannelContext (branding por tenant)
├── pages/
│   ├── admin/          # Panel admin (rutas /admin/*)
│   ├── cliente/        # App cliente (auth, onboarding, operaciones, solicitudes)
│   └── shared/         # NotFound, CadenaInactiva
└── components/
    ├── ui/             # Componentes base reutilizables (InputSimple, SelectSimple, Button, Modal, ...)
    ├── features/       # Componentes de negocio (admin/, shared/, solicitudes/, cheques/)
    ├── guards/         # AdminGuard, OnboardingGuard
    └── layout/         # AdminLayout, DashboardLayout, TenantLayout, AuthLayout
```

Patrón de flujo de datos: **página → hook (react-query) → service → adapter → axios**.

## ⚠️ Regla crítica: casing de la API

El backend (Delphi/Pascal + FireDAC) expone campos en **PascalCase** (`CadenaValorID`, `SocioID`), pero:

1. **Respuestas**: el interceptor de `src/api/axios.js` convierte TODAS las keys de las respuestas a **minúsculas** recursivamente (`cadenavalorid`, `socioid`). Todo el código que lee datos de la API debe usar keys en minúscula.
2. **Requests (POST/PUT)**: los `adapters/` reconvierten a PascalCase antes de enviar. Usan `normalizarClaves()` (`src/utils/normalizarClaves.js`) que mapea las keys de entrada a minúsculas una sola vez, y así aceptan input en cualquier casing.

**Al agregar un endpoint de escritura nuevo: crear/extender el adapter correspondiente siguiendo este patrón. Nunca adivinar variantes de casing campo por campo.**

El interceptor también reintenta 2 veces (con backoff) ante errores de red o 5xx, y muestra un toast de error de red en métodos de escritura.

## API / Backend

- **Base URL**: `VITE_API_URL=/proxy-backend/` (en `.env`). Vite lo proxea a `http://192.168.2.103:9988` (requiere **VPN**). Ver `vite.config.js` para los rewrites especiales (ej: `/password-reset` → `/password:reset`, `/byencrypt` → `/:byencrypt`).
- **Swagger**: `http://192.168.2.103:9988/swagger/` (spec JSON en `/api/swagger.json`). Es la fuente de verdad para forma de payloads — consultarlo antes de asumir estructura.

### Endpoints principales (prefijo `api/` salvo indicado)

| Dominio | Endpoints | Notas |
|---|---|---|
| Usuarios | `usuario/login`, `usuario/alta`, `usuario/password-*`, `UsuarioCadenaValor` | Auth simple con hash; el store descarta `hashseguridad` |
| Socios (empresas) | `Socios` (GET lista, filtro `?Cuit=`), `Socio` (GET/POST/PUT), `Socio/Migrar` (a SGR+), `SocioUsuario` | "Socio" = empresa cliente de la SGR |
| Archivos | `SocioArchivo` (POST/PUT, base64 en `Contenido`) | Documentación del legajo |
| Terceros | `TerceroRelacionado`, `SocioTerceroRelacion` | Accionistas/representantes/agentes (KYC). `TipoRelacionSocioID`: 25=accionista, 230=rep. legal, 210=apoderado |
| Cadenas de valor | `cadenavalor` (GET/POST/PUT), `cadenavalor/cdas/{CadenaID}` (GET), `cadenavalor/cdas` (POST vincula) | El POST de vinculación **reemplaza** toda la lista |
| CDAs | `cda/Cda` (GET/POST/PUT), `cda/GrupoCda?Pantalla=X`, `cda/PantallaGrupoCda?Pantalla=X` (GET/POST), `cda/execute`, `cda/execute:test` | Ver sección CDAs abajo |
| Requisitos | `CadenaValorParametrizacion` (GET/POST/PUT) | Requisitos documentales por cadena/tipo de persona/sociedad |
| Líneas | `TipoLimiteSocio`, `TipoLimiteCadenaValor`, `TipoObligacionTipoLimite` | Límites de crédito |
| Core SGR+ | `sgrplus/Socios`, `sgrplus/SolicitudEnProceso` | Sistema core histórico |
| Integraciones | AFIP/ARCA (constancia inscripción), Nosis (datos por CUIT), LUFE (entidades) | Con fallback en cascada: Nosis → AFIP → LUFE |

### Motor de CDAs (Criterios de Aceptación)

Reglas de negocio evaluadas contra datos de integraciones externas para aprobar/rechazar operaciones.

- **Expresión**: `afip.datosgenerales.apellido = 'REINA'`, `nosis.Variables(CDA_SCO) > 500`, `afip.datosmonotributo.actividad.Count < 1`. Prefijos por integración: `afip.` (ARCA), `nosis.`, `lufe.`, `casfog.`, `sgrplus.`. ARCA requiere valores en MAYÚSCULAS; el resto preserva el casing del JSON.
- **3 niveles de configuración** (admin): CDAs globales (definición), CDAs por cadena de valor (vinculación + valor de comparación custom), CDAs por pantalla (agrupación con expresión lógica sobre tokens `cdaN`, ej: `cda1050 and cda1 or cda1053`).
- **Pantallas actuales**: `PANTALLA_INGRESO_CUIT` (valida la empresa en Paso1Cuit del onboarding) y `PANTALLA_SOCIOS` (valida accionistas/representantes en sus modales).
- **Ejecución**: `GET cda/execute?Pantalla=X&Cuit=Y&CadenaValorID=Z`. Códigos: `202` pasa, `406` no cumple (devuelve mensaje de rechazo), `400` "CDAs Inexistentes", `409` dato faltante, `500` error. El frontend la maneja vía `useCdaEngine` (`src/hooks/useCdaEngine.js`).
- ⚠️ **Bug conocido del backend** (reportado a Victor): el parser de `ExpresionAgrupacion` falla con 500 `"Couldn't find cdaX"` cuando hay paréntesis y un ID de CDA es prefijo numérico de otro (ej: `cda1` y `cda1050`). Workaround: evitar paréntesis cuando se concatena en plano (`and` tiene mayor precedencia que `or`, así que casi nunca hacen falta).
- ⚠️ `useCdaEngine` hardcodea que el CDA con ID=10 no es bloqueante (socio protector en otra SGR). Frágil: depende de un ID de base de datos.

## Multi-tenant (app cliente)

- Rutas cliente bajo `/:cadenaSlug/*` donde el slug es el **CadenaValorID numérico** (ej: `/950225/login`).
- `TenantLayout` valida el ID contra la API, chequea `activa`, y setea el branding (logo/colores) vía `ChannelContext`.
- Cadenas reales en el ambiente de desarrollo: COMAFI (950225), BANCO PATAGONIA (950230), CREDICUOTAS (950233), BANCO NACION (950274).
- Rutas admin bajo `/admin/*` (globales, sin tenant), protegidas por `AdminGuard`. Login admin en `/login`.

## Dominio (glosario)

- **Cadena de valor**: programa de financiamiento (tipo supply-chain) que agrupa empresas; funciona como tenant.
- **CDA**: Criterio De Aceptación — regla de validación automática (ver arriba).
- **Legajo**: expediente digital de la empresa (datos + socios + documentación). Se arma en el wizard de onboarding (`Paso1Cuit` ... `Paso7Exito`).
- **Socio**: empresa cliente de la SGR (NO una persona).
- **Terceros relacionados**: personas vinculadas a un socio (accionistas con % de participación, representantes legales, apoderados, agentes de bolsa).
- **Solicitud**: pedido de garantía/préstamo (`SolicitudEnProceso` en SGR+).
- **Línea / TipoLimite**: límite de crédito configurado por cadena o por socio.
- **SGR+ / SGRPlus**: sistema core legacy al que se migran los legajos aprobados.

## Convenciones de código

- **Todo en español**: nombres de variables, funciones, comentarios, mensajes de UI (`crearSocio`, `obtenerCdasPorCadenaId`). No traducir términos de dominio.
- Componentes: carpeta propia con `Componente.jsx` + `Componente.module.css`.
- Usar los componentes de `src/components/ui/` (con `variant="admin"` en el panel admin — tema azul vs. amarillo del cliente). Para confirmaciones usar `ConfirmacionModal`.
- Acciones destructivas o de creación importantes llevan modal de confirmación.
- Diseño mobile-first en la app cliente; el panel admin prioriza desktop (idealmente sin scroll de página en full HD).
- Tokens de diseño en `src/index.css` (`--color-azul-bind`, `--yellow`, fuente Metropolis). Estética fintech dark: fondos `#0d1117`/translúcidos, bordes sutiles, `border-radius` generoso.
- Los datos de respuesta de API siempre en minúsculas (`item.cadenavalorid`); defensivamente se aceptan variantes, pero lo canónico es minúscula.

## Gotchas conocidos

- `EditarCadenaModal`/`ActivarCadenaModal` arman su estado desde respuestas ya lowercaseadas; los adapters lo toleran gracias a `normalizarClaves`.
- El POST `cadenavalor/cdas` y el POST `cda/PantallaGrupoCda` **reemplazan** la lista completa de vinculaciones: siempre leer lo existente primero (con `cda/GrupoCda?Pantalla=` para pantallas) y reenviar todo junto.
- `GET cda/PantallaGrupoCda` devuelve un **array** (aunque se filtre por una sola pantalla) y NO incluye la lista de CDAs (solo `ExpresionAgrupacion`); la lista sale de `GET cda/GrupoCda?Pantalla=`.
- El backend usa FireDAC con pool de conexiones limitado: al hacer múltiples escrituras (ej. guardar requisitos), enviarlas **secuencialmente**, no en `Promise.all`.
- CUIT: prefijos `20/23/24/25/26/27` = persona física (`TipoPersonaID` 1), `30/33/34` = jurídica (10 en socios, 2 en terceros — ojo, difiere por tabla).

# Reglas de Estilo de Código
* NUNCA agregues comentarios explicativos dentro de los bloques de código.
* El código debe entregarse limpio y listo para producción.
* Si necesitas explicar algo, hacelo fuera del bloque de código, en texto plano.