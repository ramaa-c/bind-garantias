import api from "../api/axios";

export const sistemaService = {
  // GET api - devuelve un string plano (ej. "SGRPlus API Web Version 1.0"),
  // no un objeto - el interceptor de axios.js deja pasar strings sin tocar.
  obtenerVersionApi: async () => (await api.get("api")).data,
};
