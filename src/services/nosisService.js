import api from "../api/axios";

// El cliente de Nosis del lado del backend arranca "en frío": la primera
// consulta después de un rato sin uso puede devolver un cuerpo vacío/
// incompleto (200 OK, pero sin Contenido.Datos.Variables) o fallar
// directamente, aunque el servicio esté sano (confirmado reintentando a
// mano contra el mismo endpoint). Sin reintentar, ese hueco hace que el
// alta de empresa (y los modales de representante/accionista) caigan
// siempre a LUFE/AFIP —con menos datos— por una falla que en la práctica
// es transitoria.
const ESPERA_REINTENTO_MS = 1500;

// El interceptor de axios (ver src/api/axios.js) ya convirtió las keys de
// la respuesta a minúsculas antes de llegar acá — leer en PascalCase acá
// (Contenido/Datos/Variables/Nombre/Valor) hacía que esta condición diera
// siempre undefined, tratando a Nosis como "no disponible" aunque
// respondiera bien (confirmado en vivo: la respuesta cruda tiene datos
// completos, pero llega como data.contenido.datos.variables).
const extraerDiccionario = (data) => {
  if (
    !data ||
    !data.contenido ||
    !data.contenido.datos ||
    !data.contenido.datos.variables
  ) {
    return null;
  }
  const diccionario = {};
  data.contenido.datos.variables.forEach((v) => {
    if (v.nombre) {
      diccionario[v.nombre] = v.valor;
    }
  });
  return diccionario;
};

export const nosisService = {
  obtenerVariables: async (cuit) => {
    try {
      const cuitLimpio = String(cuit).replace(/\D/g, "");
      const response = await api.get(`api/nosis/${cuitLimpio}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Un solo reintento (con una espera corta) alcanza para no perder Nosis
  // por un arranque en frío puntual: nunca tira (equivalente al `null` que
  // ya devolvía antes), los callers ya lo tratan como "no hay datos" y
  // caen a AFIP/LUFE.
  obtenerDatosNormalizados: async (cuit) => {
    try {
      const primerIntento = extraerDiccionario(
        await nosisService.obtenerVariables(cuit),
      );
      if (primerIntento) return primerIntento;
    } catch (error) {
      console.warn(
        "[nosisService] Primer intento contra Nosis falló, reintentando una vez (posible arranque en frío del backend)...",
        error,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, ESPERA_REINTENTO_MS));

    try {
      return extraerDiccionario(await nosisService.obtenerVariables(cuit));
    } catch (error) {
      console.warn(
        "[nosisService] Nosis volvió a fallar en el reintento, se cae a AFIP/LUFE.",
        error,
      );
      return null;
    }
  },
};
