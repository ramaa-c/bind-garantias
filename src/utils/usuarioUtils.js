import { toast } from "sonner";

// Las respuestas de GET usuario/{id}/pornombre no tienen forma consistente
// según el backend haya matcheado por id, por nombre o por email - a veces
// viene el registro plano, a veces envuelto en {items:[...]} o {data:[...]}.
export const extraerRegistroUsuario = (db) => {
  if (!db) return null;
  if (Array.isArray(db)) return db[0] || null;
  if (db.items) return db.items[0] || null;
  if (db.data) return db.data[0] || null;
  return db;
};

// Administrador General (EsAdministrador=1): ve todo el panel admin, no
// tiene Socio ni legajo propio. Distinto del "admin restringido", que no
// tiene esta marca y solo está vinculado a cadenas por UsuarioCadenaValor
// (ver useAdminRestrictions). El backend devuelve el flag como string.
export const esAdministradorActivo = (registro) => {
  const valor = registro?.esadministrador ?? registro?.EsAdministrador;
  return valor === "1" || valor === 1 || valor === true;
};

const extraerVinculosCadena = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.items) return data.items;
  if (data.data) return data.data;
  if (typeof data === "object" && Object.keys(data).length > 0) return [data];
  return [];
};

export const vinculosCadenaActivos = (data) =>
  extraerVinculosCadena(data).filter((vinculo) => {
    const valor = vinculo?.activa ?? vinculo?.Activa;
    return valor === "1" || valor === 1 || valor === true;
  });

// Nombre de usuario legible a partir del email, para precargar Denominacion
// al dar de alta la cuenta (el usuario puede cambiarlo después desde "Mi
// cuenta") - toma la parte antes del @ y reemplaza separadores comunes por
// espacios: "ramiro_gabriel@..." -> "ramiro gabriel".
export const denominacionDesdeEmail = (email) => {
  const local = String(email || "").split("@")[0] || "";
  return local
    .replace(/[._\-+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const FECHA_VENCIMIENTO_USUARIO = "2999-12-31T00:00:00";

export const ESTADO_USUARIO = {
  BLOQUEADO: "0",
  ACTIVO: "1",
  PENDIENTE_ACTIVACION: "2",
  BLOQUEADO_ADMIN: "9",
};

const leerEstadoUsuario = (registro) =>
  String(registro?.estado ?? registro?.Estado ?? "");

export const esUsuarioBloqueado = (registro) =>
  [ESTADO_USUARIO.BLOQUEADO, ESTADO_USUARIO.BLOQUEADO_ADMIN].includes(
    leerEstadoUsuario(registro),
  );

export const esUsuarioBloqueadoPorAdmin = (registro) =>
  leerEstadoUsuario(registro) === ESTADO_USUARIO.BLOQUEADO_ADMIN;

export const esUsuarioPendienteActivacion = (registro) =>
  leerEstadoUsuario(registro) === ESTADO_USUARIO.PENDIENTE_ACTIVACION;

export const VIGENCIA_CODIGO_LOGIN_MS = 5 * 60 * 1000;

export const MENSAJE_CUENTA_NO_ACTIVA = "Tu cuenta no está activa.";

export const HABILITAR_CUENTA_CLIENTE =
  "Usá \"Recuperar clave\" para habilitarla.";

export const DESBLOQUEO_CUENTA_ADMIN =
  "Contactá a soporte para recuperar el acceso.";

export const MENSAJE_CUENTA_BLOQUEADA_ADMIN =
  "Tu cuenta fue bloqueada por un administrador. Contactá a soporte.";

export const MENSAJE_CUENTA_VENCIDA = "Tu cuenta venció. Contactá a soporte.";

export const avisarCuentaVencida = () =>
  toast.error("Tu cuenta venció", { description: "Contactá a soporte." });

export const esRespuestaCuentaNoActiva = (error) =>
  [406, 423].includes(error?.response?.status);

export const esRespuestaBloqueoAdmin = (error) =>
  error?.response?.status === 403;

export const avisarCuentaNoActiva = (descripcion) =>
  toast.error("Tu cuenta no está activa", { description: descripcion });

export const avisarBloqueoAdmin = () =>
  toast.error("Tu cuenta fue bloqueada por un administrador", {
    description: "Contactá a soporte.",
  });

export const esClaveActualIncorrecta = (error) =>
  error?.response?.status === 401 &&
  /incorrect/i.test(String(error?.response?.data?.message ?? ""));

export const esDemasiadosIntentos =(error) => error?.response?.status === 429;

export const avisarDemasiadosIntentos = () =>
  toast.error("Demasiados intentos", {
    description: "Esperá unos minutos y volvé a probar.",
  });

export const esCodigoLoginExpirado = (error) => {
  const data = error?.response?.data;
  const mensaje = data?.message ?? data?.Message ?? "";
  return /expirad/i.test(String(mensaje));
};

export const mensajeCodigoLoginRechazado = (error) =>
  esCodigoLoginExpirado(error)
    ? "El código venció. Solicitá uno nuevo."
    : "Código incorrecto.";
