import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
  FiSend,
  FiInfo,
} from "react-icons/fi";
import { toast } from "sonner";
import { useValidacionLegajo } from "../../../../hooks/useValidacionLegajo";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { sociosService } from "../../../../services/sociosService";
import { Button } from "../../../ui/Button/Button";
import { ConfirmacionModal } from "../ConfirmacionModal/ConfirmacionModal";
import styles from "./LegajoUniversalBar.module.css";

export function LegajoUniversalBar() {
  const { socioIdActivo } = useEmpresaActiva();
  const queryClient = useQueryClient();

  const {
    isValid,
    errores,
    totalRequisitos,
    requisitosCompletados,
    isLoading,
  } = useValidacionLegajo();

  const [expanded, setExpanded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (isLoading || totalRequisitos === 0) {
    return null;
  }

  const porcentaje = Math.round((requisitosCompletados / totalRequisitos) * 100);

  const handleEnviarLegajo = async () => {
    if (!isValid) {
      toast.error("No se puede enviar el legajo porque está incompleto.", {
        description: "Revisá los requisitos pendientes haciendo click en la barra de estado.",
      });
      return;
    }

    setEnviando(true);
    const toastId = toast.loading("Enviando legajo consolidado a SGR+...");
    try {
      const response = await sociosService.enviarASgrPlus(socioIdActivo);
      if (response.success) {
        toast.success("¡Legajo enviado con éxito a SGR+!", {
          id: toastId,
          description: "La información fue consolidada y transferida al esquema SGR+.",
        });
        // Invalidar queries para refrescar estado si es necesario
        queryClient.invalidateQueries({ queryKey: ["socioLegajoCompleto"] });
        queryClient.invalidateQueries({ queryKey: ["socioArchivos"] });
      } else {
        throw new Error(response.message || "Error al transferir el legajo");
      }
    } catch (err) {
      console.error("Error al enviar legajo a SGR+:", err);
      toast.error("Error al enviar el legajo", {
        id: toastId,
        description: "Ocurrió un error inesperado al enviar los datos a SGR+.",
      });
    } finally {
      setEnviando(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className={`${styles.container} ${isValid ? styles.containerValid : styles.containerInvalid}`}>
      <div className={styles.barHeader}>
        <div className={styles.statusInfo} onClick={() => errores.length > 0 && setExpanded(!expanded)} style={{ cursor: errores.length > 0 ? "pointer" : "default" }}>
          <div className={`${styles.statusIcon} ${isValid ? styles.iconGreen : styles.iconAmber}`}>
            {isValid ? (
              <FiCheckCircle size={22} className={styles.pulseAnimation} />
            ) : (
              <FiAlertTriangle size={22} />
            )}
          </div>
          <div className={styles.textGroup}>
            <div className={styles.statusTitle}>
              {isValid ? "Legajo completo y verificado" : "Legajo incompleto para SGR+"}
            </div>
            <div className={styles.statusSubtitle}>
              {isValid
                ? "Todos los requisitos parametrizados han sido completados correctamente."
                : `Completados ${requisitosCompletados} de ${totalRequisitos} requisitos (${porcentaje}%).`}
            </div>
          </div>
        </div>

        <div className={styles.progressBarWrapper}>
          <div className={styles.progressBarBg}>
            <div
              className={`${styles.progressBarFill} ${isValid ? styles.fillGreen : styles.fillAmber}`}
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <span className={styles.progressText}>{porcentaje}%</span>
        </div>

        <div className={styles.actions}>
          {!isValid && errores.length > 0 && (
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setExpanded(!expanded)}
              aria-label="Ver detalles"
            >
              {expanded ? (
                <>
                  Ocultar pendientes <FiChevronUp style={{ marginLeft: "0.25rem" }} />
                </>
              ) : (
                <>
                  Ver pendientes <FiChevronDown style={{ marginLeft: "0.25rem" }} />
                </>
              )}
            </button>
          )}

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setShowConfirm(true)}
            disabled={!isValid || enviando}
            className={styles.sendBtn}
          >
            <FiSend style={{ marginRight: "0.5rem" }} />
            {enviando ? "Enviando..." : "Enviar a SGR+"}
          </Button>
        </div>
      </div>

      {expanded && !isValid && errores.length > 0 && (
        <div className={styles.detailsPanel}>
          <div className={styles.detailsTitle}>
            <FiInfo size={14} style={{ marginRight: "0.4rem" }} />
            Requisitos obligatorios pendientes para el envío a SGR+:
          </div>
          <ul className={styles.errorList}>
            {errores.map((err, idx) => (
              <li key={idx} className={styles.errorItem}>
                <span className={styles.bulletRed} />
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmacionModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleEnviarLegajo}
        titulo="Enviar Legajo a SGR+"
        mensaje="¿Estás seguro de que deseas enviar toda la información cargada al esquema SGR+? Esta acción consolidará los datos y documentos obligatorios de la empresa."
        isLoading={enviando}
      />
    </div>
  );
}

export default LegajoUniversalBar;
