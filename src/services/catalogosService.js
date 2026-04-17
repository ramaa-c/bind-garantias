import api from '../api/axios';

export const catalogosService = {
    obtenerProvincias: async () => {
        try {
            const response = await api.get('/Provincia');
            return response.data;
        } catch (error) {
            console.error("Error al traer las provincias:", error);
            throw error;
        }
    },

    obtenerMonedas: async () => {
        try {
            const response = await api.get('/Moneda');
            return response.data;
        } catch (error) {
            console.error("Error al traer las monedas:", error);
            throw error;
        }
    },

    obtenerTiposProducto: async () => {
        try {
            const response = await api.get('/TipoLimite');
            return response.data;
        } catch (error) {
            console.error("Error al traer los tipos de producto:", error);
            throw error;
        }
    }
};