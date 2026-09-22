import { useQueries, useQuery } from "@tanstack/react-query";
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

// Catálogo real de SGR+ (los vínculos legales posibles entre un tercero y un
// socio, con la Descripcion tal cual vive en SGR+). Es la fuente de la que
// el admin elige qué relaciones activar y renombrar para la web (ver
// useTipoRelacionSocio.js).
export const useTipoRelacionSocioReal = () =>
  useQuery({
    queryKey: ["catalogos", "tipoRelacionSocioReal"],
    queryFn: catalogosService.obtenerTipoRelacionSocio,
    staleTime: STALE_TIME,
    select: (data) => mapAndSort(data, "tiporelacionsocioid"),
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

export const useTipoModeloDocumento = () =>
  useQuery({
    queryKey: ["catalogos", "tipoModeloDocumento"],
    queryFn: catalogosService.obtenerTipoModeloDocumento,
    staleTime: STALE_TIME,
    select: (data) => {
      const arrayReal = Array.isArray(data) ? data : data?.list || [];
      const arrayLimpio = arrayReal.filter((item) => item !== null);
      return mapAndSort(arrayLimpio, "tipomodelodocumentoid");
    },
  });

// TextoModeloDocumento/HTMLModeloDocumento (el contrato completo en base64)
// se descartan acá: son varios cientos de KB por modelo y no se usan para
// llenar el combo. Si en algún momento hacen falta, conviene pedirlos aparte
// por ModeloDocumentoID en vez de guardarlos en esta caché.
export const useModelosDocumento = (tipoModeloDocumentoId) =>
  useQuery({
    queryKey: ["catalogos", "modelosDocumento", tipoModeloDocumentoId],
    queryFn: () => catalogosService.obtenerModelosDocumento(tipoModeloDocumentoId),
    enabled: !!tipoModeloDocumentoId,
    staleTime: STALE_TIME,
    select: (data) => {
      const arrayReal = Array.isArray(data) ? data : data?.list || [];
      const arrayLimpio = arrayReal
        .filter((item) => item !== null)
        .map((item) => {
          const { textomodelodocumento: _texto, htmlmodelodocumento: _html, ...resto } = item;
          return resto;
        });
      return mapAndSort(arrayLimpio, "modelodocumentoid", "descripcion");
    },
  });

// Parámetros de varios modelos de documento a la vez. Devuelve
// { porModelo: Map(modeloDocumentoID -> parámetros), cargando }.
//
// Dos usos, ambos por adelantado (no al momento de generar el PDF):
// - Dashboard: saber ya en el render si una solicitud va a poder generar su
//   documento, para que el botón avise antes de clickear y la pestaña nueva
//   solo se abra cuando realmente va a funcionar (ver useAbrirModeloDocumento).
// - Alta/edición de cadena: filtrar del combo los modelos que no se pueden
//   resolver desde una solicitud (ver esModeloResolubleDesdeSolicitud).
//
// El endpoint es liviano - devuelve apenas la lista de campos, no el
// contenido del modelo.
export const useParametrosModelosDocumento = (modeloIds) => {
  const ids = (modeloIds || []).map(Number).filter((id) => id > 0);

  return useQueries({
    queries: ids.map((id) => ({
      queryKey: ["catalogos", "parametrosModeloDocumento", id],
      queryFn: () => catalogosService.obtenerParametrosModeloDocumento(id),
      staleTime: STALE_TIME,
    })),
    // Los resultados vienen en el mismo orden que `queries`, así que el
    // índice alcanza para volver a asociar cada uno con su modelo.
    combine: (resultados) => {
      const porModelo = new Map();
      resultados.forEach((resultado, i) => {
        if (Array.isArray(resultado.data)) porModelo.set(ids[i], resultado.data);
      });
      return { porModelo, cargando: resultados.some((r) => r.isPending) };
    },
  });
};
