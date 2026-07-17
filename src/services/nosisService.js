import api from "../api/axios";

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
  obtenerDatosNormalizados: async (cuit) => {
    const data = await nosisService.obtenerVariables(cuit);
    if (
      !data ||
      !data.Contenido ||
      !data.Contenido.Datos ||
      !data.Contenido.Datos.Variables
    ) {
      return null;
    }
    const variables = data.Contenido.Datos.Variables;
    const diccionario = {};
    variables.forEach((v) => {
      if (v.Nombre) {
        diccionario[v.Nombre] = v.Valor;
      }
    });
    return diccionario;
  },
};
