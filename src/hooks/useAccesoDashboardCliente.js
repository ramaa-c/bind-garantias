import { useMemo } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useEmpresaActiva } from "./useEmpresaActiva";
import { useObtenerLimitesSocio, useObtenerSolicitudesEnProceso } from "./useSolicitudes";
import { useValidacionLegajo } from "./useValidacionLegajo";
import { ESTADO_PENDIENTE, ESTADO_APROBADA } from "../utils/estadoLimiteSocio";

// Gate central del nuevo flujo "con línea activa": si la cadena tiene
// TipoLimiteCadenaValor.Activa (mismo chequeo que ya usa
// useVerificarHabilitacionSolicitudes, vía el store), el cliente entra
// directo a Solicitudes y Legajo/Documentación quedan bloqueados hasta que
// tenga alguna solicitud que el CDA de PANTALLA_LINEAS no haya rechazado.
// Eso puede verse en dos tablas (mismo criterio que ya usa Solicitudes.jsx
// para tieneSolicitudPendiente/listaSolicitudes): un TipoLimiteSocio en
// estado Pendiente o Aprobada, O una fila en SolicitudEnProceso — esta
// última el backend la borra apenas deja de estar Inicial/EnProceso
// (confirmado el 2026-08-18), así que su sola presencia ya implica que
// sigue activa, sin necesidad de mirar su estado. Documentación, a su vez,
// sigue exigiendo Legajo 100% completo en los dos escenarios (con y sin
// línea) — antes ese "100%" solo bloqueaba el botón "Nueva Operación",
// nunca la navegación en sí.
export const useAccesoDashboardCliente = () => {
  const hayLineaActiva = useAuthStore((state) => state.isSolicitudesEnabled);
  const { socioIdActivo, cuitActivo } = useEmpresaActiva();
  const { data: limitesSocio, isLoading: cargandoLimites } =
    useObtenerLimitesSocio(socioIdActivo || 0);
  const { data: solicitudesEnProceso, isLoading: cargandoProceso } =
    useObtenerSolicitudesEnProceso(cuitActivo);
  const { faltanLegajo, isLoading: cargandoLegajo } = useValidacionLegajo();

  const tieneSolicitudActiva = useMemo(() => {
    const hayLimiteActivo =
      Array.isArray(limitesSocio) &&
      limitesSocio.some((s) => {
        const estado = Number(s.tipolimiteestadoid ?? ESTADO_PENDIENTE);
        return estado === ESTADO_PENDIENTE || estado === ESTADO_APROBADA;
      });
    const hayProcesoActivo =
      Array.isArray(solicitudesEnProceso) && solicitudesEnProceso.length > 0;
    return hayLimiteActivo || hayProcesoActivo;
  }, [limitesSocio, solicitudesEnProceso]);

  const legajoDesbloqueado = !hayLineaActiva || tieneSolicitudActiva;
  const documentacionDesbloqueada = legajoDesbloqueado && !faltanLegajo;

  return {
    hayLineaActiva,
    legajoDesbloqueado,
    documentacionDesbloqueada,
    cargando:
      (!!socioIdActivo && cargandoLimites) ||
      (!!cuitActivo && cargandoProceso) ||
      cargandoLegajo,
  };
};

export default useAccesoDashboardCliente;
