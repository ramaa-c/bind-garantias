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
import { calcularEstadoDesdeHistorial } from "../utils/executeCda";
import { esCdaActivo } from "../utils/cdaUtils";
import { useObtenerGrupoCdaConCdas } from "./useCadenaValor";

export const useObtenerSocios = (params = {}) => {
  return useQuery({
    queryKey: ["socios", "lista", params],
    queryFn: () => sociosService.obtenerSocios(params),
    staleTime: 1000 * 60 * 2, // 2 minutos
    placeholderData: keepPreviousData,
  });
};

// EmpresaDetalle.jsx (panel admin) necesita ver en tiempo real lo que el
// socio fue cargando en su propio onboarding: refetchOnMount:"always" hace
// que cada vez que se entra a esa pantalla se vuelva a pedir el dato,
// ignorando el staleTime (que sigue sirviendo para evitar refetch en
// remontados internos del mismo componente, ej. cambiar de tab).
export const useSocioPorId = (socioId) => {
  return useQuery({
    queryKey: ["socios", "detalle", Number(socioId)],
    queryFn: () => sociosService.obtenerSocioPorId(socioId),
    enabled: !!socioId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnMount: "always",
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
                queryKey: ["socios", "detalle", Number(variables.socioid)],
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

// Confirmación real (no inferida) de si un socio ya se migró al core: si el
// CUIT aparece en sgrplus/Socios es porque efectivamente vive ahí — a
// diferencia de leer Socio.Legajo (un campo sin documentar, solo
// correlacionado empíricamente con la migración), esto consulta
// directamente al sistema al que se supone que se migró.
export const useEstaMigradoEnSgrPlus = (cuit) => {
  const cuitLimpio = String(cuit || "").replace(/\D/g, "");
  return useQuery({
    queryKey: ["sgrplus", "socios", "porCuit", cuitLimpio],
    queryFn: async () => {
      const resultado = await sociosService.obtenerSociosSgrplus({ Cuit: cuitLimpio });
      return Array.isArray(resultado) && resultado.length > 0;
    },
    enabled: !!cuitLimpio,
    staleTime: 1000 * 60 * 2, // 2 minutos
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
  // Number(...) acá es crítico: distintos endpoints (SocioUsuario, Socio,
  // POST /Socio) no son consistentes serializando este ID (a veces number, a
  // veces string numérico). Si no se normaliza, la queryKey que arma este
  // hook (la que realmente queda cacheada/observada por OnboardingGuard)
  // puede no calzar con la que usa AltaDatosEmpresa.jsx al invalidar tras el
  // PUT del Paso 2 — el invalidateQueries queda mudo, el guard sigue leyendo
  // el socio viejo (sin teléfono) y rebota de nuevo al Paso 2.
  const socioIds = lista
    .map((s) => Number(s.socioid ?? s.SocioID ?? s.SocioId))
    .filter((id) => !Number.isNaN(id));

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
// socio a partir de SU PROPIO historial, en vez de re-ejecutar el CDA en
// cada login (eso ensuciaría el historial con una fila nueva por cada
// entrada).
//
// ⚠️ A propósito NO mira la vinculación vigente del grupo de CDAs de la
// cadena: si un socio aprobó al hacer el alta, esa sigue siendo su
// condición aunque el admin después modifique el grupo (agregue, saque o
// reemplace CDAs) — es el admin quien decide si corresponde reejecutar
// para los socios que quedaron con la configuración anterior, no algo que
// deba pasar solo porque cambió la cadena. calcularEstadoDesdeHistorial
// (utils/executeCda.js) resuelve esto de puro historial: combina el
// último cierre de grupo (grupoItem.expresion, congelado) con la última
// ejecución de cada CDA de esa misma corrida, PERO si aparece un CDA ajeno
// al cierre (nunca fue miembro de él — pasa cuando se desvincularon los
// viejos y se vinculó uno nuevo en un grupo reducido a 1, que no genera
// cierre) ese único ajeno pasa a ser todo el resultado, sin arrastrar a
// los miembros viejos ya obsoletos (ver combinarEstadoCdas/cdaIdsDelCierre
// para el detalle). Si en cambio se agrega un CDA nuevo al grupo sin
// evaluarlo para este socio, el historial no sabe nada de él y el
// resultado sigue siendo el del cierre viejo — tampoco lo afecta.
// cadenaValorId (opcional) solo se usa para desambiguar el caso de
// historial vacío (calcularEstadoDesdeHistorial devuelve null, distinto de
// "pendiente"): puede ser que el socio nunca haya tenido una corrida
// registrada porque la cadena directamente no tiene NINGÚN CDA vinculado a
// PANTALLA_INGRESO_CUIT — nunca se había contemplado ese caso, y debe
// contar como aprobado (no hay nada que validar), no como pendiente. Se
// resuelve con una consulta liviana a la vinculación vigente (misma que ya
// usa el admin, ver cdasActivosIdsGrupo en EmpresaDetalle.jsx), pero SOLO
// cuando hace falta desambiguar — en el caso común (ya hay historial) no
// agrega ningún pedido extra.
export const useEstadoCdaSocio = (socioId, cadenaValorId) => {
  const { data: historial, isPending } = useObtenerExecuteCda(socioId);

  const estadoHistorial = useMemo(() => {
    if (!socioId || isPending) return undefined;
    const lista = Array.isArray(historial) ? historial : historial ? [historial] : [];
    return calcularEstadoDesdeHistorial(lista);
  }, [socioId, isPending, historial]);

  const necesitaChequearVinculacion = estadoHistorial === null && !!cadenaValorId;
  const { data: grupoCdaData, isPending: isPendingGrupo } = useObtenerGrupoCdaConCdas(
    necesitaChequearVinculacion ? cadenaValorId : null,
    necesitaChequearVinculacion ? "PANTALLA_INGRESO_CUIT" : null,
  );

  const data = useMemo(() => {
    if (!socioId || isPending) return undefined;
    if (estadoHistorial !== null) return estadoHistorial ?? "pendiente";
    if (!necesitaChequearVinculacion) return "pendiente";
    if (isPendingGrupo) return undefined;
    const cdasActivos = (grupoCdaData?.cdas || []).filter(esCdaActivo);
    return cdasActivos.length === 0 ? "aprobado" : "pendiente";
  }, [socioId, isPending, estadoHistorial, necesitaChequearVinculacion, isPendingGrupo, grupoCdaData]);

  return {
    data,
    isPending: !!socioId && (isPending || (necesitaChequearVinculacion && isPendingGrupo)),
  };
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
