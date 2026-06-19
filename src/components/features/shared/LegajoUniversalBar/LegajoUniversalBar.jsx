import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
  FiSend,
  FiInfo,
  FiArrowRight,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useChannel } from "../../../../context/ChannelContext";
import { useValidacionLegajo } from "../../../../hooks/useValidacionLegajo";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { sociosService } from "../../../../services/sociosService";
import { Button } from "../../../ui/Button/Button";
import { ConfirmacionModal } from "../ConfirmacionModal/ConfirmacionModal";
import styles from "./LegajoUniversalBar.module.css";

export function LegajoUniversalBar({ context }) {
  const { socioIdActivo } = useEmpresaActiva();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { channelInfo } = useChannel();

  const {
    isValid,
    errores,
    totalRequisitos,
    totalDocumentosObligatorios,
    totalLegajoObligatorios,
    requisitosCompletados,
    isLoading,
    faltanDocumentos,
    faltanLegajo
  } = useValidacionLegajo();

  const [showConfirm, setShowConfirm] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const hasMandatoryInContext = 
    (context === "documentacion" && totalDocumentosObligatorios > 0) ||
    (context === "legajo" && totalLegajoObligatorios > 0) ||
    !context;

  if (isLoading || totalRequisitos === 0 || !hasMandatoryInContext) {
    return null;
  }

  const isContextInvalid =
    (context === "documentacion" && faltanDocumentos) ||
    (context === "legajo" && faltanLegajo) ||
    (!context && !isValid);

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
    <div className={`${styles.container} ${isValid ? styles.containerValid : (isContextInvalid ? styles.containerInvalid : "")}`}>
      <div className={styles.barHeader}>
        <div className={styles.statusInfo}>
          <div className={styles.circularProgressWrapper}>
            <svg viewBox="0 0 36 36" className={styles.circularChart}>
              <path
                className={styles.circleBg}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${styles.circleFill} ${isValid ? styles.fillGreenStroke : styles.fillAmberStroke}`}
                strokeDasharray={`${porcentaje}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="21.5" className={styles.percentage}>{porcentaje}%</text>
            </svg>
          </div>
          <div className={styles.textGroup}>
            <div className={styles.statusTitle}>
              {isValid ? "Legajo completo y verificado" : "Legajo incompleto para SGR+"}
            </div>
            <div className={styles.statusSubtitle}>
              {isValid
                ? "Todos los requisitos parametrizados han sido completados correctamente."
                : `Completados ${requisitosCompletados} de ${totalRequisitos} requisitos.`}
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          {!context && !isValid ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const basePath = `/${channelInfo?.id || "default"}`;
                if (faltanLegajo) {
                  navigate(`${basePath}/legajo`);
                } else if (faltanDocumentos) {
                  navigate(`${basePath}/documentacion`);
                }
              }}
              className={styles.sendBtn}
            >
              Ir
              <FiArrowRight style={{ marginLeft: "0.5rem" }} />
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowConfirm(true)}
              disabled={!isValid || enviando}
              className={`${styles.sendBtn} ${isValid ? styles.sendBtnActive : styles.sendBtnInactive}`}
            >
              <FiSend style={{ marginRight: "0.5rem" }} />
              {enviando ? "Enviando..." : "Enviar a SGR+"}
            </Button>
          )}
        </div>
      </div>

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
