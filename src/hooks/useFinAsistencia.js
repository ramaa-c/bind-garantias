import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "../store/useAuthStore";
import { useChannel } from "../context/useChannel";
import { borrarTokenApi } from "../api/tokenApi";
import { ASISTENCIA_ACTIVA, ASISTENCIA_PENDIENTE, CLAVE_ASISTENCIAS } from "./useAsistenciaInterna";

const AVISO_PREVIO_MS = 5 * 60 * 1000;
const RELECTURA_PENDIENTE_MS = 8 * 1000;

const sigueVigente = (asistencia, ahora) => {
  if (asistencia.estado !== ASISTENCIA_ACTIVA) return true;
  const vencimiento = new Date(asistencia.vencimiento).getTime();
  return Number.isNaN(vencimiento) || vencimiento > ahora;
};

export const useFinAsistencia = (asistenciaActual, vigentesQueAtiendo, nombreEmpresa) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { basePath } = useChannel();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const cambiarEmpresa = useAuthStore((state) => state.cambiarEmpresa);

  const finalizarRef = useRef(() => {});
  useEffect(() => {
    finalizarRef.current = () => {
      const empresa = nombreEmpresa || "la empresa";
      const ahora = Date.now();
      const otras = vigentesQueAtiendo.filter((a) => a.id !== asistenciaActual?.id && sigueVigente(a, ahora));
      if (otras.length > 0) {
        toast.info(`Tu asistencia a ${empresa} finalizó`, {
          description: "Podés seguir con las otras empresas que estás asistiendo.",
          duration: 10000,
        });
        cambiarEmpresa();
        queryClient.invalidateQueries({ queryKey: CLAVE_ASISTENCIAS });
        navigate(`${basePath}/elegir-empresa`, { replace: true });
        return;
      }
      borrarTokenApi();
      clearAuth();
      queryClient.clear();
      toast.info(`Tu asistencia a ${empresa} finalizó`, {
        description: "Para volver a ingresar, la empresa tiene que pedir una nueva asistencia.",
        duration: 15000,
      });
      navigate(`${basePath}/login`, { replace: true });
    };
  });

  const asistenciaId = asistenciaActual?.id ?? null;
  const pendiente = asistenciaActual?.estado === ASISTENCIA_PENDIENTE;
  const vencimientoMs =
    asistenciaActual?.estado === ASISTENCIA_ACTIVA ? new Date(asistenciaActual.vencimiento).getTime() : NaN;

  useEffect(() => {
    if (!asistenciaId || !pendiente) return undefined;
    const relectura = setTimeout(
      () => queryClient.invalidateQueries({ queryKey: CLAVE_ASISTENCIAS }),
      RELECTURA_PENDIENTE_MS,
    );
    return () => clearTimeout(relectura);
  }, [asistenciaId, pendiente, queryClient]);

  useEffect(() => {
    if (!asistenciaId || Number.isNaN(vencimientoMs)) return undefined;
    const restanteMs = vencimientoMs - Date.now();
    const temporizadores = [];
    if (restanteMs > AVISO_PREVIO_MS) {
      temporizadores.push(
        setTimeout(() => {
          toast.warning("Tu acceso de asistencia termina en 5 minutos", {
            id: "aviso-fin-asistencia",
            description: "Guardá lo que estés haciendo.",
            duration: AVISO_PREVIO_MS,
          });
        }, restanteMs - AVISO_PREVIO_MS),
      );
    }
    temporizadores.push(setTimeout(() => finalizarRef.current(), Math.max(restanteMs, 0)));
    return () => temporizadores.forEach(clearTimeout);
  }, [asistenciaId, vencimientoMs]);
};
