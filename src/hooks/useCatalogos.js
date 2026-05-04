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

export const useTipoActividadSEPYME = () =>
  useQuery({
    queryKey: ["catalogos", "tipoActividadSEPYME"],
    queryFn: catalogosService.obtenerTipoActividadSEPYME,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "tipoactividadsepymeid"),
  });

export const useTipoActividadBCRA = () =>
  useQuery({
    queryKey: ["catalogos", "tipoActividadBCRA"],
    queryFn: catalogosService.obtenerTipoActividadBCRA,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "tipoactividadbcraid"),
  });

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

export const useTamanioEmpresa = () =>
  useQuery({
    queryKey: ["catalogos", "tamanioEmpresa"],
    queryFn: catalogosService.obtenerTamanioEmpresa,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "tamanioempresaid"),
  });

export const useTipoComision = () =>
  useQuery({
    queryKey: ["catalogos", "tipoComision"],
    queryFn: catalogosService.obtenerTipoComision,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "tipocomisionid"),
  });

export const useTipoCotizacion = () =>
  useQuery({
    queryKey: ["catalogos", "tipoCotizacion"],
    queryFn: catalogosService.obtenerTipoCotizacion,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "tipocotizmonid"),
  });

export const useCotizacion = (moneda, fecha, tipoCotizacion) =>
  useQuery({
    queryKey: ["catalogos", "cotizacion", moneda, fecha, tipoCotizacion],
    queryFn: () =>
      catalogosService.obtenerCotizacion({ moneda, fecha, tipoCotizacion }),
    enabled: !!moneda && !!fecha && !!tipoCotizacion,
    staleTime: 1000 * 60 * 5, // 5 minutos de caché
  });

export const useTipoReferencia = () =>
  useQuery({
    queryKey: ["catalogos", "tipoReferencia"],
    queryFn: catalogosService.obtenerTipoReferencia,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "tiporeferenciaid"),
  });

export const useTipoTerceroRelacionado = () =>
  useQuery({
    queryKey: ["catalogos", "tipoTerceroRelacionado"],
    queryFn: catalogosService.obtenerTipoTerceroRelacionado,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "tipotercerorelacionadoid"),
  });

export const useTipoRelacionSocio = () =>
  useQuery({
    queryKey: ["catalogos", "tipoRelacionSocio"],
    queryFn: catalogosService.obtenerTipoRelacionSocio,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "tiporelacionsocioid"),
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

export const useTipoActividadGlobal = () =>
  useQuery({
    queryKey: ["catalogos", "tipoActividadGlobal"],
    queryFn: catalogosService.obtenerTipoActividadGlobal,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "tipoactividadglobalid"),
  });

export const useTipoRegimenIva = () =>
  useQuery({
    queryKey: ["catalogos", "tipoRegimenIva"],
    queryFn: catalogosService.obtenerTipoRegimenIva,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "tiporegimenivaid"),
  });

export const useTipoCondicionFianza = () =>
  useQuery({
    queryKey: ["catalogos", "tipoCondicionFianza"],
    queryFn: catalogosService.obtenerTipoCondicionFianza,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "tipocondicionfianzaid"),
  });

export const useTipoLimiteEstado = () =>
  useQuery({
    queryKey: ["catalogos", "tipoLimiteEstado"],
    queryFn: catalogosService.obtenerTipoLimiteEstado,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "tipolimiteestadoid"),
  });

export const useTipoLimiteRiesgo = () =>
  useQuery({
    queryKey: ["catalogos", "tipoLimiteRiesgo"],
    queryFn: catalogosService.obtenerTipoLimiteRiesgo,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "tipolimiteriesgoid"),
  });

export const useTiposProducto = () =>
  useQuery({
    queryKey: ["catalogos", "tiposProducto"],
    queryFn: catalogosService.obtenerTiposProducto,
    staleTime: STALE_TIME,
    select: (data) => {
      const dataActiva = data.filter((prod) => prod.activo === "1");
      return mapAndSort(dataActiva, "tipolimiteid");
    },
  });

export const useTipoSocio = () =>
  useQuery({
    queryKey: ["catalogos", "tipoSocio"],
    queryFn: catalogosService.obtenerTipoSocio,
    staleTime: STALE_TIME,
    select: (data) => {
      const arrayReal = Array.isArray(data) ? data : data?.list || [];
      const arrayLimpio = arrayReal.filter((item) => item !== null);
      return mapAndSort(arrayLimpio, "tiposocioid");
    },
  });

export const useProvincias = () =>
  useQuery({
    queryKey: ["catalogos", "provincias"],
    queryFn: catalogosService.obtenerProvincias,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "provinciaid"),
  });

export const useTipoPersona = () =>
  useQuery({
    queryKey: ["catalogos", "tipoPersona"],
    queryFn: catalogosService.obtenerTipoPersona,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "tipopersonaid"),
  });

export const useSectorContable = () =>
  useQuery({
    queryKey: ["catalogos", "sectorContable"],
    queryFn: catalogosService.obtenerSectorContable,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "sectorcontableid"),
  });

export const useTipoCartera = () =>
  useQuery({
    queryKey: ["catalogos", "tipoCartera"],
    queryFn: catalogosService.obtenerTipoCartera,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "tipocarteraid"),
  });
