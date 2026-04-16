// Salimos de 'services' y entramos a 'api'
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
    }
};