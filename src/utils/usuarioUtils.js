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

export const ESTADO_USUARIO = {
  BLOQUEADO: "0",
  ACTIVO: "1",
  PENDIENTE_ACTIVACION: "2",
};

const leerEstadoUsuario = (registro) =>
  String(registro?.estado ?? registro?.Estado ?? "");

export const esUsuarioBloqueado = (registro) =>
  leerEstadoUsuario(registro) === ESTADO_USUARIO.BLOQUEADO;

export const esUsuarioPendienteActivacion = (registro) =>
  leerEstadoUsuario(registro) === ESTADO_USUARIO.PENDIENTE_ACTIVACION;

export const VIGENCIA_CODIGO_LOGIN_MS = 5 * 60 * 1000;

export const MENSAJE_CUENTA_BLOQUEADA =
  "Cuenta bloqueada por superar el máximo de intentos.";

export const DESBLOQUEO_CUENTA_CLIENTE =
  "Para desbloquearla, usá \"Recuperar clave\" y generá una nueva contraseña.";

export const DESBLOQUEO_CUENTA_ADMIN =
  "Contactá a soporte para recuperar el acceso.";

export const avisarCuentaBloqueada = (descripcion) =>
  toast.error("Tu cuenta fue bloqueada", { description: descripcion });

export const esCodigoLoginExpirado = (error) => {
  const data = error?.response?.data;
  const mensaje = data?.message ?? data?.Message ?? "";
  return /expirad/i.test(String(mensaje));
};

export const mensajeCodigoLoginRechazado = (error) =>
  esCodigoLoginExpirado(error)
    ? "El código venció. Solicitá uno nuevo."
    : "Código incorrecto.";
