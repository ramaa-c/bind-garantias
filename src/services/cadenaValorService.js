import api from './axios';

export const cadenaValorService = {
    // GET /CadenaValor/ObtenerTodas
    obtenerTodas: async () => (await api.get('/CadenaValor/ObtenerTodas')).data,
    
    // GET /CadenaValor/ObtenerTodas/{cursaPlataforma}
    obtenerTodasPorPlataforma: async (cursaPlataforma) => (await api.get(`/CadenaValor/ObtenerTodas/${cursaPlataforma}`)).data,
    
    // GET /CadenaValor/Obtener/{CadenaValorID}
    obtenerPorId: async (cadenaValorId) => (await api.get(`/CadenaValor/Obtener/${cadenaValorId}`)).data,
    
    // GET /CadenaValor/Libradores/{CadenaValorID}
    obtenerLibradores: async (cadenaValorId, page = 1, pageSize = 10) => (await api.get(`/CadenaValor/Libradores/${cadenaValorId}`, { params: { page, page_size: pageSize } })).data,
    
    // GET /CadenaValor/Libradores/{CadenaValorID}/{CuitLibrador}
    obtenerLibradorPorCuit: async (cadenaValorId, cuitLibrador) => (await api.get(`/CadenaValor/Libradores/${cadenaValorId}/${cuitLibrador}`)).data,
    
    // GET /CadenaValor/Lineas/{CadenaValorID}
    obtenerLineas: async (cadenaValorId) => (await api.get(`/CadenaValor/Lineas/${cadenaValorId}`)).data,
    
    // GET /CadenaValor/Relaciones/{CadenaValorID}/{email}
    verificarAutorizacionEmail: async (cadenaValorId, email) => (await api.get(`/CadenaValor/Relaciones/${cadenaValorId}/${email}`)).data,
    
    // GET /CadenaValor/RelacionesPorEmail/{email}
    obtenerCadenasPorEmail: async (email) => (await api.get(`/CadenaValor/RelacionesPorEmail/${email}`)).data,
    
    // GET /CadenaValor/Relaciones/{CadenaValorID}
    obtenerRelaciones: async (cadenaValorId) => (await api.get(`/CadenaValor/Relaciones/${cadenaValorId}`)).data,
    
    // GET /CadenaValor/Utilizado/{CadenaValorID}
    obtenerUtilizado: async (cadenaValorId) => (await api.get(`/CadenaValor/Utilizado/${cadenaValorId}`)).data
};