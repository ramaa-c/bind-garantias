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
// ⚠️ A propósito NO compara contra la definición VIGENTE del grupo de CDAs
// de la cadena (ExpresionAgrupacion/CDAs activos actuales) — eso se probó y
// se descartó: como esa definición puede cambiar en cualquier momento desde
// el admin, comparar contra ella hace que un socio ya evaluado (aprobado o
// no) pueda pasar a mostrar otro resultado en su próximo login sin que se
// haya ejecutado nada nuevo para él, solo porque alguien editó el grupo de
// esa cadena. Acá se usa calcularEstadoDesdeHistorial: infiere la
// combinación and/or del propio texto congelado del último cierre de grupo
// (grupoItem.expresion) y la combina con la ÚLTIMA ejecución conocida de
// cada CDA de esa misma corrida (ver obtenerCdasDeLaCorridaActual +
// combinarEstadoCdas en utils/executeCda.js) — un snapshot de lo que
// realmente se evaluó para ESE socio, no de las reglas de hoy.
//
// Esto sigue reflejando un forzado puntual del admin post-cierre (CdaID +
// ValorParticularExpresion, ver EmpresaDetalle.jsx): esa fila queda con un
// SocioExecuteCdaID más nuevo que el último cierre, así que
// obtenerCdasDeLaCorridaActual la toma igual. Lo que NO hace (a propósito,
// es la contracara aceptada del cambio): si se agrega un CDA nuevo a un
// grupo ya aprobado antes, el historial no sabe nada de ese CDA para este
// socio y el resultado sigue siendo el del cierre viejo — un socio ya
// procesado no queda retroactivamente afectado por cambios futuros al
// grupo de su cadena. EmpresaDetalle.jsx sí sigue comparando contra la
// definición vigente (estadoEfectivo) — ahí es información para el admin,
// no la puerta de acceso del cliente.
export const useEstadoCdaSocio = (socioId) => {
  const { data: historial, isPending } = useObtenerExecuteCda(socioId);

  const data = useMemo(() => {
    if (!socioId || isPending) return undefined;
    const lista = Array.isArray(historial) ? historial : historial ? [historial] : [];
    return calcularEstadoDesdeHistorial(lista) ?? "pendiente";
  }, [socioId, isPending, historial]);

  return { data, isPending: !!socioId && isPending };
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
