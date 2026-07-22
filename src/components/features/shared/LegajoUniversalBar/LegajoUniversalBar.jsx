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
import { useLegajoModalStore } from "../../../../store/useLegajoModalStore";
import { sociosService } from "../../../../services/sociosService";
import { Button } from "../../../ui/Button/Button";
import Spinner from "../../../ui/Spinner/Spinner";
import { MigracionExitosaModal } from "../MigracionExitosaModal/MigracionExitosaModal";
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
    tipoPersonaId,
  } = useValidacionLegajo();

  const [isMigrating, setIsMigrating] = useState(false);
  const [lastAttemptedFingerprint, setLastAttemptedFingerprint] = useState("");
  const [showMigracionExitosa, setShowMigracionExitosa] = useState(false);
  const modalesLegajoAbiertos = useLegajoModalStore((s) => s.modalesAbiertos);

  const fingerprint = useMemo(() => {
    if (!socioIdActivo || isLoading) return "";
    const archivosKey = (archivosBackend || [])
      .map((a) => {
        const refDate = a.fchreferencia || a.FchReferencia || "";
        const refText = a.referencia || a.Referencia || "";
        return `${a.socioarchivoid || a.id}-${a.nombrearchivo || a.nombre || a.descripcion || ""}-${refDate}-${refText}`;
      })
      .join("|");
    // Incluye TODOS los campos editables de la persona (no solo unos pocos):
    // cualquier cambio en el legajo de un accionista/representante/agente
    // (nombre, CUIT, domicilio completo, ciudad, participación, etc.) tiene
    // que volver a disparar la migración a SGR+. Si un campo editable queda
    // afuera de esta huella, un cambio en ESE campo pasa desapercibido y el
    // sistema cree erróneamente que sigue sincronizado.
    const personaFingerprint = (p) =>
      [
        p.terceroid || p.id,
        p.nombre || "",
        p.cuit || "",
        p.email || "",
        p.telefono || p.celular || "",
        p.direccion || p.calle || "",
        p.numero || "",
        p.piso || "",
        p.departamento || "",
        p.codpos || "",
        p.ciudadid || "",
        p.provinciaid || "",
        p.participacion || 0,
        p.nrosubcuentacaja || "",
        p.rolId || "",
      ].join("-");

    const accionistasKey = (socioLegajoData?.accionistas || [])
      .map(personaFingerprint)
      .join("|");
    const representantesKey = (socioLegajoData?.representantes || [])
      .map(personaFingerprint)
      .join("|");
    const agentesKey = (socioLegajoData?.agentesBolsa || [])
      .map(personaFingerprint)
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

    // En "legajo" (a diferencia de "documentacion") completar el último
    // requisito puede pasar DENTRO de una modal propia (Representante,
    // SocioAccionista, Bolsa) que todavía sigue abierta — incluso mientras
    // esa modal corre su propia validación de CDA. Si se dispara la
    // migración (y el aviso de éxito) en ese momento, el usuario lo ve
    // superpuesto a una modal que ni terminó de guardar. Se pospone hasta
    // que no quede ninguna abierta; ver useLegajoModalStore.
    if (context === "legajo" && modalesLegajoAbiertos > 0) {
      console.log(
        `[LegajoUniversalBar] Hay ${modalesLegajoAbiertos} modal(es) de legajo abierta(s): se pospone la migración hasta que se cierren.`,
      );
      return;
    }

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
          // El toast pasaba desapercibido para un momento que el usuario
          // necesita notar sí o sí: se reemplaza por una modal más visible.
          toast.dismiss(toastId);
          setShowMigracionExitosa(true);
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
  }, [socioIdActivo, isValid, fingerprint, isMigrating, isLoading, context, modalesLegajoAbiertos, lastAttemptedFingerprint, queryClient, localStorageKey]);

  const hasMandatoryInContext =
    (context === "documentacion" && totalDocumentosObligatorios > 0) ||
    (context === "legajo" && totalLegajoObligatorios > 0) ||
    !context;

  // Se renderiza sin importar si la barra decide ocultarse en este contexto:
  // la migración puede completarse en cualquier momento y el aviso tiene que
  // verse sí o sí, no solo cuando la barra también está visible.
  const migracionExitosaModal = (
    <MigracionExitosaModal
      isOpen={showMigracionExitosa}
      onClose={() => setShowMigracionExitosa(false)}
    />
  );

  if (isLoading || totalRequisitos === 0 || !hasMandatoryInContext) {
    return migracionExitosaModal;
  }

  const isContextInvalid =
    (context === "documentacion" && faltanDocumentos) ||
    (context === "legajo" && faltanLegajo) ||
    (!context && !isValid);

  const porcentaje = Math.round((requisitosCompletados / totalRequisitos) * 100);

  const getMissingActionMessage = () => {
    if (isValid) return "Todos los requisitos han sido completados correctamente.";

    if (context === "documentacion" && !faltanDocumentos && faltanLegajo) {
      return "¡Documentos listos! Te falta completar información en la pestaña Legajo.";
    }
    if (context === "legajo" && !faltanLegajo && faltanDocumentos) {
      return "¡Datos de legajo listos! Te falta subir documentos obligatorios en Documentación.";
    }
    if (faltanDocumentos && faltanLegajo) {
      return "Te falta subir documentos obligatorios y completar datos de personas en el legajo.";
    }
    
    if (faltanLegajo && !faltanDocumentos) {
      const textErrores = errores.join(" ").toLowerCase();
      const faltanAcc = textErrores.includes("accionista") || textErrores.includes("participación");
      const faltanRep = textErrores.includes("representante") || textErrores.includes("apoderado");
      // Persona Física llama "Apoderado" a lo que en Jurídica es
      // "Representante Legal" (mismo dato, ver useValidacionLegajo).
      const etiquetaRep = Number(tipoPersonaId) === 1 ? "apoderado" : "representantes legales";

      if (faltanAcc && faltanRep) return `Te falta completar datos de accionistas y ${etiquetaRep}.`;
      if (faltanAcc) return "Te falta completar datos o documentos de los accionistas obligatorios.";
      if (faltanRep) return `Te falta completar datos de ${etiquetaRep === "apoderado" ? "tu apoderado" : "los representantes legales"}.`;
      return "Te falta completar algunos datos requeridos del legajo.";
    }

    if (faltanDocumentos && !faltanLegajo) {
      return "Te falta subir algunos documentos comerciales/impositivos obligatorios.";
    }

    return `Completados ${requisitosCompletados} de ${totalRequisitos} requisitos.`;
  };

  return (
    <>
      {migracionExitosaModal}
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
              {getMissingActionMessage()}
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
    </>
  );
}

export default LegajoUniversalBar;
