// Resolución de "a qué cadena de valor corresponde esta URL", sin llevar el
// ID en el path. Se apoya en /tenants.json (ver public/tenants.json), un
// archivo estático que vive en la carpeta del sitio en IIS y que se puede
// editar ahí mismo para dar de alta una cadena nueva, sin rebuild.
//
// Hay dos modos posibles, resueltos una sola vez al arrancar la app:
//
//   MODO_POR_HOST  → el hostname matcheó una cadena del archivo (o hay un
//                    override de desarrollo). Las rutas de cliente cuelgan
//                    de la raíz: /login, /legajo, /documentacion...
//   MODO_LEGACY    → no matcheó nada. Se sirve exactamente lo mismo que
//                    hasta ahora: panel admin en /admin|/login y cliente en
//                    /:cadenaSlug/*. Es el fallback que mantiene vivos los
//                    links viejos ya circulando (mails de crear clave,
//                    favoritos, etc.).

export const MODO_POR_HOST = "porHost";
export const MODO_LEGACY = "legacy";

const RUTA_CONFIG = "/tenants.json";
const PARAM_OVERRIDE = "cadena";
const CLAVE_OVERRIDE = "bind-cadena-override";

// Override para desarrollo: en localhost no hay DNS de cada banco, así que
// se puede forzar la cadena con ?cadena=950274. Queda guardado en
// sessionStorage porque el query param se pierde en la primera navegación
// interna de react-router (y sería insufrible tener que reponerlo a mano en
// cada pantalla). Se limpia solo al cerrar la pestaña.
const leerOverrideDesarrollo = () => {
  if (typeof window === "undefined") return null;

  try {
    const enUrl = new URLSearchParams(window.location.search).get(PARAM_OVERRIDE);
    if (enUrl) {
      window.sessionStorage?.setItem(CLAVE_OVERRIDE, enUrl);
      return Number(enUrl) || null;
    }
    const guardado = window.sessionStorage?.getItem(CLAVE_OVERRIDE);
    return guardado ? Number(guardado) || null : null;
  } catch {
    // sessionStorage bloqueado (modo privado con cookies restringidas):
    // el override simplemente no persiste entre navegaciones.
    return null;
  }
};

const leerCadenasDelArchivo = async () => {
  try {
    const respuesta = await fetch(RUTA_CONFIG, { cache: "no-store" });
    if (!respuesta.ok) return {};
    const json = await respuesta.json();
    return json?.cadenas && typeof json.cadenas === "object" ? json.cadenas : {};
  } catch (error) {
    // Sin archivo (o mal formado) se cae a modo legacy: la app sigue
    // andando igual que antes en vez de quedar inutilizable.
    console.warn(
      "[tenantConfig] No se pudo leer /tenants.json, se continúa en modo legacy (ID de cadena en la URL):",
      error,
    );
    return {};
  }
};

export const resolverTenant = async () => {
  const cadenas = await leerCadenasDelArchivo();

  const hostname =
    typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  const idPorHost = Number(cadenas[hostname]) || null;

  if (idPorHost) {
    return { modo: MODO_POR_HOST, cadenaId: idPorHost, basePath: "" };
  }

  const idOverride = leerOverrideDesarrollo();
  if (idOverride) {
    return { modo: MODO_POR_HOST, cadenaId: idOverride, basePath: "" };
  }

  return { modo: MODO_LEGACY, cadenaId: null, basePath: null };
};
