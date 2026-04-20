import { useQuery } from '@tanstack/react-query';
import { systemService } from '../services/systemService';

export const useObtenerServerConfig = () => {
    return useQuery({
        queryKey: ['system', 'serverConfig'],
        queryFn: () => systemService.obtenerServerConfig()
    });
};

export const useDescribirServer = () => {
    return useQuery({
        queryKey: ['system', 'describirServer'],
        queryFn: () => systemService.describirServer()
    });
};

export const useDescribirPlatform = () => {
    return useQuery({
        queryKey: ['system', 'describirPlatform'],
        queryFn: () => systemService.describirPlatform()
    });
};
