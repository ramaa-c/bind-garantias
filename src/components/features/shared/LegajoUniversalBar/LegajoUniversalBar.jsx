import React, { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
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
import Spinner from "../../../ui/Spinner/Spinner";
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
    faltanLegajo,
    archivosBackend,
    socioLegajoData,
  } = useValidacionLegajo();

  const [isMigrating, setIsMigrating] = useState(false);
  const [lastAttemptedFingerprint, setLastAttemptedFingerprint] = useState("");

  const fingerprint = useMemo(() => {
    if (!socioIdActivo || isLoading) return "";
    const archivosKey = (archivosBackend || [])
      .map((a) => {
        const refDate = a.fchreferencia || a.FchReferencia || "";
        const refText = a.referencia || a.Referencia || "";
        return `${a.socioarchivoid || a.id}-${a.nombrearchivo || a.nombre || a.descripcion || ""}-${refDate}-${refText}`;
      })
      .join("|");
    const accionistasKey = (socioLegajoData?.accionistas || [])
      .map((a) => `${a.terceroid || a.id}-${a.participacion || 0}-${a.email || ""}-${a.celular || ""}-${a.direccion || ""}`)
      .join("|");
    const representantesKey = (socioLegajoData?.representantes || [])
      .map((r) => `${r.terceroid || r.id}-${r.email || ""}-${r.celular || ""}`)
      .join("|");
    const agentesKey = (socioLegajoData?.agentesBolsa || [])
      .map((b) => `${b.terceroid || b.id}-${b.nrosubcuentacaja || ""}`)
      .join("|");
    return `${archivosKey}#${accionistasKey}#${representantesKey}#${agentesKey}`;
  }, [socioIdActivo, archivosBackend, socioLegajoData, isLoading]);

  const localStorageKey = `lastMigratedFingerprint_${socioIdActivo}`;
  const [migratedFingerprint, setMigratedFingerprint] = useState(() => localStorage.getItem(localStorageKey) || "");

  const isAlreadyMigrated = useMemo(() => {
    if (!fingerprint) return false;
    return migratedFingerprint === fingerprint;
  }, [fingerprint, migratedFingerprint]);

  useEffect(() => {
    if (!socioIdActivo || !isValid || !fingerprint || isMigrating || isLoading || totalRequisitos === 0) return;

    const lastMigrated = localStorage.getItem(localStorageKey);
    const lockKey = `migrando_sgr_${socioIdActivo}`;

    if (lastMigrated === fingerprint) {
      console.log(`[LegajoUniversalBar] El legajo del socio ${socioIdActivo} ya está migrado con la misma huella.`);
      return;
    }

    if (lastAttemptedFingerprint === fingerprint) {
      console.log(`[LegajoUniversalBar] Ya se intentó migrar la huella actual y falló. Esperando cambios antes de reintentar.`);
      return;
    }

    if (sessionStorage.getItem(lockKey) === "true") {
      console.log(`[LegajoUniversalBar] Migración en progreso en otra pestaña o instancia. Abortando duplicado.`);
      return;
    }

    const autoMigrar = async () => {
      setIsMigrating(true);
      sessionStorage.setItem(lockKey, "true");
      setLastAttemptedFingerprint(fingerprint);
      console.log(`[LegajoUniversalBar] Iniciando migración automática a SGR+ para el socio ${socioIdActivo}...`);
      console.log(`[LegajoUniversalBar] Huella actual:`, fingerprint);
      const toastId = toast.loading("Sincronizando legajo con SGR+ automáticamente...");
      try {
        const response = await sociosService.enviarASgrPlus(socioIdActivo);
        console.log(`[LegajoUniversalBar] Respuesta de migración:`, response);
        if (response.success) {
          toast.success("¡Legajo sincronizado con SGR+!", {
            id: toastId,
            description: "Los cambios se guardaron y migraron con éxito.",
          });
          localStorage.setItem(localStorageKey, fingerprint);
          setMigratedFingerprint(fingerprint);
          console.log(`[LegajoUniversalBar] Migración exitosa. Guardada huella:`, fingerprint);
          queryClient.invalidateQueries({ queryKey: ["socioLegajoCompleto"] });
          queryClient.invalidateQueries({ queryKey: ["socioArchivos"] });
        } else {
          throw new Error(response.message || "Error al sincronizar");
        }
      } catch (err) {
        console.error("[LegajoUniversalBar] Error al sincronizar legajo automáticamente:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "No se pudo sincronizar automáticamente con SGR+.";
        toast.error("Error de sincronización con SGR+", {
          id: toastId,
          description: errorMessage,
        });
      } finally {
        setIsMigrating(false);
        sessionStorage.removeItem(lockKey);
      }
    };

    autoMigrar();
  }, [socioIdActivo, isValid, fingerprint, isMigrating, isLoading, lastAttemptedFingerprint, queryClient, localStorageKey]);

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
          {!isValid ? (
            !context && (
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
            )
          ) : (
            isMigrating ? (
              <div className={styles.syncStatus}>
                <Spinner size={16} className={styles.syncSpinner} />
                <span>Sincronizando...</span>
              </div>
            ) : isAlreadyMigrated ? (
              <div className={styles.syncStatusSuccess}>
                <FiCheckCircle className={styles.syncIconSuccess} />
                <span>Sincronizado</span>
              </div>
            ) : (
              <div className={styles.syncStatus}>
                <span>Sincronización pendiente</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default LegajoUniversalBar;
