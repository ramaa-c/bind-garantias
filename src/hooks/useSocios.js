import { useMemo } from "react";
import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { sociosService } from "../services/sociosService";
import { esSocioVacio } from "../utils/socioUtils";
import { calcularEstadoEfectivo, calcularEstadoDesdeHistorial } from "../utils/executeCda";
import { esCdaActivo } from "../utils/cdaUtils";
import { useObtenerGrupoCdaConCdas } from "./useCadenaValor";

const PANTALLA_INGRESO_CUIT = "PANTALLA_INGRESO_CUIT";

export const useObtenerSocios = (params = {}) => {
  return useQuery({
    queryKey: ["socios", "lista", params],
    queryFn: () => sociosService.obtenerSocios(params),
    staleTime: 1000 * 60 * 2, // 2 minutos
    placeholderData: keepPreviousData,
  });
};

export const useSocioPorId = (socioId) => {
  return useQuery({
    queryKey: ["socios", "detalle", socioId],
    queryFn: () => sociosService.obtenerSocioPorId(socioId),
    enabled: !!socioId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    placeholderData: keepPreviousData,
  });
};

const useCrearSocio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sociosService.crearSocio,
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["socios", "lista"] }),
      ]);
    },
    onError: (error) => {
      console.error("Error al crear el socio:", error);
    },
  });
};

export const useActualizarSocio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sociosService.actualizarSocio,
    onSuccess: (data, variables) => {
      return Promise.all(
        [
          queryClient.invalidateQueries({ queryKey: ["socios", "lista"] }),
          variables.socioid &&
            queryClient
              .invalidateQueries({
                queryKey: ["socios", "detalle", variables.socioid],
              })
              .catch(() => {}),
        ].filter(Boolean),
      );
    },
    onError: (error) => {
      console.error("Error al actualizar el socio:", error);
    },
  });
};

export const useObtenerExecuteCda = (socioId) => {
  return useQuery({
    queryKey: ["socios", "executeCda", socioId],
    queryFn: () => sociosService.obtenerExecuteCda(socioId),
    enabled: !!socioId,
  });
};

export const useSocioWebPorId = (socioId) => {
  return useQuery({
    queryKey: ["sociosWeb", "detalle", socioId],
    queryFn: () => sociosService.obtenerSocioWebPorId(socioId),
    enabled: !!socioId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    placeholderData: keepPreviousData,
  });
};

// SocioUsuario solo devuelve { SocioID, UsuarioWebID, momentoCreacion } — no
// alcanza para saber si esa vinculación apunta a una empresa realmente
// registrada o a un socio "stub" (creado por cda/execute o por un intento de
// onboarding abandonado en el Paso 2, ver Paso1Cuit). Este hook trae el
// detalle de cada socio vinculado y filtra los vacíos, para que
// OnboardingGuard (y quien más lo necesite) no trate un stub como una
// empresa completa.
export const useEmpresasCompletas = (socioUsuarios) => {
  const lista = Array.isArray(socioUsuarios) ? socioUsuarios : [];
  const socioIds = lista
    .map((s) => s.socioid ?? s.SocioID ?? s.SocioId)
    .filter((id) => id !== undefined && id !== null);

  const resultados = useQueries({
    queries: socioIds.map((socioId) => ({
      queryKey: ["socios", "detalle", socioId],
      queryFn: () => sociosService.obtenerSocioPorId(socioId),
      staleTime: 1000 * 60 * 5,
    })),
  });

  const isLoading = resultados.some((r) => r.isPending);
  const empresasCompletas = resultados
    .map((r) => r.data)
    .filter((socio) => socio && !esSocioVacio(socio));

  return { empresasCompletas, isLoading };
};

// Deriva el estado actual del CDA de pantalla (PANTALLA_INGRESO_CUIT) de un
// socio a partir de su historial, en vez de re-ejecutar el CDA en cada
// login (eso ensuciaría el historial con una fila nueva por cada entrada).
//
// En vez de confiar en la última fila de grupo (CdaID=0) tal cual quedó
// guardada, se RECALCULA con calcularEstadoEfectivo: toma la definición
// VIGENTE del grupo (ExpresionAgrupacion + CDAs activos, vía
// useObtenerGrupoCdaConCdas) y la combina con la ÚLTIMA ejecución conocida de
// cada CDA individual (ver armarEstadoPorCda en utils/executeCda.js). Esto
// resuelve dos problemas del enfoque anterior (leer directo la fila de
// grupo):
//   1. Cuando todas las integraciones de un grupo están deshabilitadas
//      (Modo Offline), el backend no genera fila de grupo para esa corrida
//      — antes había que detectar ese caso a mano comparando IDs.
//   2. Si un admin fuerza un CDA puntual (CdaID + ValorParticularExpresion,
//      ver EmpresaDetalle.jsx) después de que el grupo cerró en contra, el
//      backend NUNCA regenera la fila de grupo por sí solo (no es seguro
//      hacerlo con un override a nivel de pantalla completa, ver
//      cdaService.js) — con el cálculo en el cliente, ese forzado puntual sí
//      se refleja acá sin depender de una nueva corrida completa.
// requiere cadenaValorId (en el cliente, el CadenaValorID de la ruta/tenant
// actual — ver channelInfo.id en OnboardingGuard) para saber qué definición
// de grupo usar.
//
// calcularEstadoDesdeHistorial (no necesita cadenaValorId: infiere la
// combinación and/or del propio texto del último cierre) se usa SOLO como
// fallback mientras cadenaValorId todavía no resolvió — no como red de
// seguridad una vez que sí hay cadena. channelInfo.id (la cadena del tenant
// actual) es siempre confiable acá, a diferencia del selector manual del
// admin en EmpresaDetalle.jsx, así que no hace falta "salvar" a
// estadoEfectivo con el historial si da otra cosa. Al revés sería peligroso:
// si se agrega un CDA nuevo a un grupo ya aprobado antes, el historial no
// sabe nada de ese CDA (nunca se ejecutó para este socio) y seguiría
// devolviendo "aprobado" del cierre viejo — dejar que le gane a
// estadoEfectivo dejaría pasar a un usuario sin evaluar el criterio nuevo.
export const useEstadoCdaSocio = (socioId, cadenaValorId) => {
  const { data: historial, isPending: isPendingHistorial } =
    useObtenerExecuteCda(socioId);
  const { data: grupoData, isPending: isPendingGrupo } =
    useObtenerGrupoCdaConCdas(cadenaValorId, PANTALLA_INGRESO_CUIT);

  const isPending = !!socioId && (isPendingHistorial || (!!cadenaValorId && isPendingGrupo));

  const data = useMemo(() => {
    if (!socioId || isPending) return undefined;
    const lista = Array.isArray(historial) ? historial : historial ? [historial] : [];
    const estadoDesdeHistorial = calcularEstadoDesdeHistorial(lista);

    if (!cadenaValorId) return estadoDesdeHistorial ?? "pendiente";

    const cdasActivosIds = (grupoData?.cdas || [])
      .filter(esCdaActivo)
      .map((c) => Number(c.cdaid ?? c.CdaId ?? c.CdaID))
      .filter((id) => !Number.isNaN(id));

    return calcularEstadoEfectivo({
      historial: lista,
      expresionAgrupacion: grupoData?.grupo?.expresionagrupacion,
      cdasActivosIds,
      cadenaValorId,
      pantallaGrupoCdaId: grupoData?.grupo?.pantallagrupocdaid,
    });
  }, [socioId, cadenaValorId, isPending, historial, grupoData]);

  return { data, isPending };
};

export const useObtenerSocioUsuarioPorUsuarioId = (usuarioWebId) => {
  return useQuery({
    queryKey: ["socioUsuario", "listaPorUsuario", usuarioWebId],
    queryFn: () => sociosService.obtenerSocioUsuarioPorUsuarioId(usuarioWebId),
    enabled: !!usuarioWebId,
  });
};

const useVincularSocioUsuario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sociosService.vincularSocioUsuario,
    onSuccess: (data, variables) => {
      return queryClient.invalidateQueries({
        queryKey: ["socioUsuario", "listaPorUsuario", variables.usuariowebid],
      });
    },
    onError: (error) => {
      console.error("Error al vincular el socio con el usuario:", error);
    },
  });
};
