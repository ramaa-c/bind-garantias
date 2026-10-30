// Traduce un error de axios (o cualquiera con la misma forma) a un mensaje
// legible para el usuario final. Compartido entre SociosView.jsx y
// DocumentacionView.jsx para los botones "Actualizar datos vía LUFE" (antes
// duplicado en SociosView.jsx).
export const obtenerMensajeAmigable = (err, defaultMsg) => {
  if (err?.code === "ECONNABORTED" || err?.message?.toLowerCase().includes("timeout")) {
    return "El servicio externo está demorando en responder. Por favor, intentá nuevamente en unos momentos.";
  }
  if (err?.message?.toLowerCase().includes("network error") || !err?.response) {
    return "No se pudo conectar con el servidor. Verificá tu conexión a internet o reintentá más tarde.";
  }
  const status = err.response?.status;
  if (esIntegracionNoDisponible(err)) {
    return mensajeDeApi(err, "El servicio externo no está disponible en este momento. Intentá nuevamente más tarde.");
  }
  if (status >= 500) {
    return "Hubo un inconveniente en el sistema al procesar los datos. Por favor, reintentá más tarde.";
  }
  if (status === 404) {
    return "No se encontraron los datos correspondientes en el padrón.";
  }
  if (status === 403 || status === 401) {
    return "No tenés permisos para realizar esta consulta.";
  }
  if (status === 400) {
    const backendMessage = err.response?.data?.message || err.response?.data || err.response?.data?.title;
    if (esMensajeUtil(backendMessage) && backendMessage.length < 150) {
      return backendMessage;
    }
    return "Los datos de la empresa no pudieron ser validados. Revisá el CUIT y reintentá.";
  }
  return defaultMsg;
};

const FRASES_HTTP_GENERICAS =
  /^(bad request|unauthorized|forbidden|not found|method not allowed|not acceptable|request timeout|conflict|unprocessable (entity|content)|too many requests|internal server error|bad gateway|service unavailable|gateway timeout)\.?$/i;

const DETALLE_INTERNO = /FireDAC|\bSQL\b|ODBC|FOREIGN KEY|Invalid (object|column) name|\bdbo\./i;

export const esMensajeUtil = (mensaje) =>
  typeof mensaje === "string" &&
  Boolean(mensaje.trim()) &&
  mensaje.length < 300 &&
  !FRASES_HTTP_GENERICAS.test(mensaje.trim()) &&
  !DETALLE_INTERNO.test(mensaje);

const RUTAS_INTEGRACION_EXTERNA = /api\/(afip|nosis|lufe)\//i;

export const esRutaIntegracionExterna = (url = "") => RUTAS_INTEGRACION_EXTERNA.test(url);

// 502/503 de AFIP/ARCA, Nosis o LUFE: el servicio externo no respondió o respondió con un error.
export const esIntegracionNoDisponible = (err) =>
  [502, 503].includes(err?.response?.status) && esRutaIntegracionExterna(err?.config?.url);

// Mensaje que devuelve la API en el cuerpo del error ({ statusCode, message }); si no hay, el texto por defecto.
export const mensajeDeApi = (err, porDefecto = "") => {
  const data = err?.response?.data;
  const mensaje = typeof data === "string" ? data : data?.message;
  return esMensajeUtil(mensaje) ? mensaje : porDefecto;
};

// Igual que mensajeDeApi, pero solo para los errores de negocio (400, 403, 409, 429) y las integraciones no disponibles: el resto (5xx, red) muestra el texto por defecto.
export const mensajeNegocio = (err, porDefecto = "") =>
  [400, 403, 409, 429].includes(err?.response?.status) || esIntegracionNoDisponible(err)
    ? mensajeDeApi(err, porDefecto)
    : porDefecto;
