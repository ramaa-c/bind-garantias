import api from '../api/axios';

export const systemService = {
    // GET /system/serverconfig.info
    obtenerServerConfig: async () => (await api.get('/system/serverconfig.info')).data,

    // GET /system/describeserver.info
    describirServer: async () => (await api.get('/system/describeserver.info')).data,

    // GET /system/describeplatform.info
    describirPlatform: async () => (await api.get('/system/describeplatform.info')).data
};