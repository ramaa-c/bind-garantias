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
    if (typeof backendMessage === "string" && backendMessage.length < 150) {
      return backendMessage;
    }
    return "Los datos de la empresa no pudieron ser validados. Revisá el CUIT y reintentá.";
  }
  return defaultMsg;
};
