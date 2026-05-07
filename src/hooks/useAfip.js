import { useQuery, useMutation } from "@tanstack/react-query";
import { afipService } from "../services/afipService";

export const useValidarCuitAfip = () => {
    return useMutation({
        mutationFn: (cuit) => afipService.obtenerConstanciaInscripcion(cuit),
    });
};