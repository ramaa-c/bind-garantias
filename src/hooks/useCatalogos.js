import { useQuery } from "@tanstack/react-query";
import { catalogosService } from "../services/catalogosService";

export const useMonedas = () => {
  return useQuery({
    queryKey: ["catalogos", "monedas"],
    queryFn: catalogosService.obtenerMonedas,
    staleTime: 1000 * 60 * 60 * 24,
    select: (data) => {
      const opciones = data.map((moneda) => ({
        value: moneda.monedaid.toString(),
        label: moneda.descripcion,
      }));
      opciones.sort((a, b) => a.label.localeCompare(b.label));

      return { raw: data, opciones };
    },
  });
};

export const useProvincias = () => {
  return useQuery({
    queryKey: ["catalogos", "provincias"],
    queryFn: catalogosService.obtenerProvincias,
    staleTime: 1000 * 60 * 60 * 24,
    select: (data) => {
      const opciones = data.map((prov) => ({
        value: prov.provinciaid.toString(),
        label: prov.descripcion,
      }));
      opciones.sort((a, b) => a.label.localeCompare(b.label));
      return { raw: data, opciones };
    },
  });
};

export const useTiposProducto = () => {
    return useQuery({
        queryKey: ["catalogos", "tiposProducto"],
        queryFn: catalogosService.obtenerTiposProducto,
        staleTime: 1000 * 60 * 60 * 24,
        select: (data) => {
            const opciones = data
                .filter((prod) => prod.activo === "1" && prod.tipolimiteid !== 0)
                .map((prod) => ({
                    value: prod.tipolimiteid.toString(),
                    label: prod.descripcion,
                }));

            opciones.sort((a, b) => a.label.localeCompare(b.label));
            return { raw: data, opciones };
        },
    });
};
