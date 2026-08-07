import React from "react";
import { FiRefreshCw, FiShield } from "react-icons/fi";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useObtenerExecuteCdaTercero } from "../../../../../../hooks/useTerceros";
import { useObtenerExecuteCda } from "../../../../../../hooks/useSocios";
import { useCdaEngine } from "../../../../../../hooks/useCdaEngine";
import { useUsuarioWebIdActual } from "../../../../../../hooks/useUsuario";
import {
  calcularEstadoDesdeHistorial,
  detectarCadenaValorId,
  formatearMomentoControl,
  normalizarHistorialTercero,
} from "../../../../../../utils/executeCda";
import { Button } from "../../../../../ui/Button/Button";
import { Spinner } from "../../../../../ui/Spinner/Spinner";
import styles from "../../DocumentosLegajo.module.css";

// Herramienta puntual para admin: muestra el resultado de la última corrida
// de CDAs (pantalla PANTALLA_SOCIOS) para ESTE tercero puntual y permite
// reejecutarla. Solución rápida acordada con Victor mientras no se justifica
// construir un historial/panel completo para terceros (como el que ya
// existe para socios) — ver conversación del 2026-07-21.
export function TerceroCdaEstado({ terceroId, socioIdActivo }) {
  const queryClient = useQueryClient();
  const usuarioWebId = useUsuarioWebIdActual();
  const { ejecutarValidaciones, loading: ejecutando } = useCdaEngine();

  const { data: historialTercero, isLoading } = useObtenerExecuteCdaTercero(terceroId);
  // Fallback si el tercero todavía no tiene ninguna ejecución propia (recién
  // agregado): se detecta la cadena desde el historial del socio en su lugar.
  const { data: historialSocio } = useObtenerExecuteCda(socioIdActivo);

  const filas = normalizarHistorialTercero(historialTercero);
  const cadenaValorId =
    detectarCadenaValorId(filas) ?? detectarCadenaValorId(normalizarHistorialTercero(historialSocio));

  // Mismo cálculo que usa la card roja de la lista (useEstadoCdaTerceros) —
  // a propósito NO es "cualquier CDA que alguna vez falló" (eso incluiría
  // CDAs viejos ya desvinculados del grupo, como uno que se reemplazó por
  // otro): solo mira el resultado de la corrida vigente actual.
  const estadoActual = calcularEstadoDesdeHistorial(filas);
  const ultimaFila = [...filas].sort(
    (a, b) => (Number(b.socioexecutecdaid) || 0) - (Number(a.socioexecutecdaid) || 0),
  )[0];

  const handleReejecutar = async () => {
    if (!cadenaValorId) {
      toast.error("No se pudo detectar la cadena de valor para reejecutar los CDAs de esta persona.");
      return;
    }
    const resultado = await ejecutarValidaciones("PANTALLA_SOCIOS", { terceroId }, cadenaValorId, usuarioWebId);
    if (resultado.success) {
      toast.success("CDAs reejecutados con éxito para esta persona.");
    } else {
      const mensaje = resultado.errors?.[0]?.message || "No se cumplieron los criterios de aceptación.";
      toast.error(mensaje);
    }
    queryClient.invalidateQueries({ queryKey: ["terceros", "executeCda", terceroId] });
    // Sin esto, la card de la lista (AccionistasSection/RepresentantesSection/
    // ApoderadosSection) y el gate de migración (useValidacionLegajo, que
    // lee el mismo mapa) siguen mostrando el estado viejo — useEstadoCdaTerceros
    // es una query separada de la de acá arriba.
    queryClient.invalidateQueries({ queryKey: ["terceros", "estadoCdaBulk"] });
  };

  if (isLoading) {
    return (
      <div className={`${styles.socioDetail} ${styles.terceroCdaWrapper}`}>
        <Spinner size={14} />
      </div>
    );
  }

  const tieneHistorial = filas.length > 0;
  const hayRechazo = estadoActual === "rechazado";
  const claseBadge = !tieneHistorial
    ? styles.reqBadgeOptional
    : hayRechazo
      ? styles.reqBadgeRechazado
      : styles.reqBadgeComplete;

  return (
    <div className={`${styles.socioDetail} ${styles.terceroCdaWrapper}`}>
      <FiShield className={styles.socioDetailIcon} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 }}>
        <span className={styles.socioDetailLabel}>Estado CDA (Composición/Representantes)</span>
        {tieneHistorial ? (
          <>
            <span className={`${styles.reqBadge} ${claseBadge}`}>
              {hayRechazo ? "Rechazado" : "Aprobado"}
            </span>
            <span className={styles.socioDetailVal} style={{ fontSize: "0.75rem", color: "#8b949e" }}>
              Última corrida: {formatearMomentoControl(ultimaFila?.momentocontrol)}
            </span>
          </>
        ) : (
          <span className={styles.socioDetailVal}>Sin ejecuciones registradas todavía.</span>
        )}
        <Button
          variant="outlineBlue"
          size="sm"
          onClick={handleReejecutar}
          isLoading={ejecutando}
          disabled={ejecutando || !cadenaValorId}
          title={!cadenaValorId ? "No se pudo detectar la cadena de valor" : "Volver a ejecutar los CDAs de esta persona"}
        >
          <FiRefreshCw size={12} /> Volver a ejecutar
        </Button>
      </div>
    </div>
  );
}

export default TerceroCdaEstado;
