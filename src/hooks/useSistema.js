import { useQuery } from "@tanstack/react-query";
import { sistemaService } from "../services/sistemaService";

export const useVersionApi = () => {
  return useQuery({
    queryKey: ["sistema", "versionApi"],
    queryFn: sistemaService.obtenerVersionApi,
    staleTime: 1000 * 60 * 30,
    retry: false,
  });
};
