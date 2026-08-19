import { useQuery } from "@tanstack/react-query";
import { catalogosService } from "../services/catalogosService";

const mapAndSort = (data, idField, descField = "descripcion") => {
  if (!data) return { raw: [], opciones: [] };
  const opciones = data
    .filter((item) => item[idField] !== 0)
    .map((item) => ({
      value: item[idField].toString(),
      label: item[descField],
    }));
  opciones.sort((a, b) => a.label.localeCompare(b.label));
  return { raw: data, opciones };
};

const STALE_TIME = 1000 * 60 * 60 * 24;

export const useSituacionBCRA = () =>
  useQuery({
    queryKey: ["catalogos", "situacionBCRA"],
    queryFn: catalogosService.obtenerSituacionBCRA,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "situacionbcraid"),
  });

export const useEstadoSocio = () =>
  useQuery({
    queryKey: ["catalogos", "estadoSocio"],
    queryFn: catalogosService.obtenerEstadoSocio,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "estadosocioid"),
  });

export const useEstadoExecuteCda = () =>
  useQuery({
    queryKey: ["catalogos", "estadoExecuteCda"],
    queryFn: catalogosService.obtenerEstadoExecuteCda,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "estadoexecutecdaid"),
  });

export const useTamanioEmpresa = () =>
  useQuery({
    queryKey: ["catalogos", "tamanioEmpresa"],
    queryFn: catalogosService.obtenerTamanioEmpresa,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "tamanioempresaid"),
  });

export const useTipoContrato = () =>
  useQuery({
    queryKey: ["catalogos", "tipoContrato"],
    queryFn: catalogosService.obtenerTipoContrato,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "tipocontratoid"),
  });

export const useMonedas = () =>
  useQuery({
    queryKey: ["catalogos", "monedas"],
    queryFn: catalogosService.obtenerMonedas,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "monedaid"),
  });

export const useTipoCanalComercializacion = () =>
  useQuery({
    queryKey: ["catalogos", "tipoCanalComercializacion"],
    queryFn: catalogosService.obtenerTipoCanalComercializacion,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "tipocanalcomercializacionid"),
  });

export const useTiposProducto = () =>
  useQuery({
    queryKey: ["catalogos", "tiposProducto"],
    queryFn: catalogosService.obtenerTiposProducto,
    staleTime: STALE_TIME,
    select: (data) => {
      const arrayReal = Array.isArray(data) ? data : data?.list || [];
      const arrayLimpio = arrayReal.filter((item) => item !== null);
      const dataActiva = arrayLimpio.filter((prod) => 
        (String(prod.activo) === "1" || String(prod.activa) === "1") && 
        String(prod.escadenavalor) === "1"
      );
      return mapAndSort(dataActiva, "tipolimiteid");
    },
  });

export const useProvincias = () =>
  useQuery({
    queryKey: ["catalogos", "provincias"],
    queryFn: catalogosService.obtenerProvincias,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "provinciaid"),
  });

export const useCiudades = (provinciaId) =>
  useQuery({
    queryKey: ["catalogos", "ciudades", provinciaId],
    queryFn: () => catalogosService.obtenerCiudades(provinciaId),
    enabled: !!provinciaId,
    select: (data) => mapAndSort(data, "ciudadid"),
  });

export const usePartidos = (provinciaId) =>
  useQuery({
    queryKey: ["catalogos", "partidos", provinciaId],
    queryFn: () => catalogosService.obtenerPartidos(provinciaId),
    enabled: !!provinciaId,
    select: (data) => mapAndSort(data, "partidoid"),
  });

export const useEquipoComercial = () =>
  useQuery({
    queryKey: ["catalogos", "equipoComercial"],
    queryFn: catalogosService.obtenerEquipoComercial,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "equipocomercialid"),
  });

export const useObligaciones = () =>
  useQuery({
    queryKey: ["catalogos", "obligaciones"],
    queryFn: catalogosService.obtenerObligaciones,
    staleTime: STALE_TIME,
    select: (data) => {
      const arrayReal = Array.isArray(data) ? data : data?.list || [];
      const arrayLimpio = arrayReal.filter((item) => item !== null);
      return mapAndSort(arrayLimpio, "tipoobligacionid");
    },
  });
