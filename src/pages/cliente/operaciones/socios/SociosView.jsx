import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FiUsers as FiUsersIcon, FiRefreshCw } from "react-icons/fi";
import { SociosLegajo, LegajoUniversalBar } from "../../../../components/features";
import { ConfirmacionModal } from "../../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { Button, InfoTooltip } from "../../../../components/ui";
import { HelpDrawer } from "../../../../components/layout/Client/HelpDrawer/HelpDrawer";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { useValidacionLegajo } from "../../../../hooks/useValidacionLegajo";
import { sociosService } from "../../../../services/sociosService";
import { enriquecerSociosLufeAfip } from "../../../../utils/enriquecimiento";
import { obtenerMensajeAmigable } from "../../../../utils/mensajesError";
import { toast } from "sonner";
import styles from "./SociosView.module.css";

export default function SociosView() {
  const queryClient = useQueryClient();
  const { socioIdActivo, cuitActivo } = useEmpresaActiva();

  // Mismo criterio que hayDocumentacionRequerida en DocumentacionView.jsx:
  // sin ningún requisito obligatorio en legajo (accionistas/apoderados/
  // representante legal/agentes de bolsa, según useValidacionLegajo), no
  // tiene sentido ofrecer "Consultar a LUFE" acá. Mientras isLoading, se
  // asume que sí hay algo (default más seguro que ocultar el botón y
  // hacerlo aparecer después).
  const { totalLegajoObligatorios, isLoading: isLoadingValidacion } = useValidacionLegajo();
  const hayLegajoRequerido = isLoadingValidacion || totalLegajoObligatorios > 0;

  const [sincronizando, setSincronizando] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsHelpOpen((prev) => !prev);
    document.addEventListener("bindHelp:toggle", handler);
    return () => document.removeEventListener("bindHelp:toggle", handler);
  }, []);

  const handleRefrescarLufe = async () => {
    if (!socioIdActivo || !cuitActivo) {
      toast.error("No se pudo identificar la empresa activa.");
      return;
    }

    setSincronizando(true);
    setShowConfirmModal(false);
    const toastId = toast.loading("Sincronizando legajo con LUFE y AFIP...");
    try {
      // 1. Ejecutar la precarga LUFE + enriquecimiento síncrono AFIP + PUTs de accionistas y representantes/apoderados
      const resEnriquecimiento = await enriquecerSociosLufeAfip(socioIdActivo, cuitActivo);

      // 2. Vincular documentos de LUFE
      try {
        await sociosService.obtenerDocumentosLufe(cuitActivo, true);
      } catch {
        // Silently handle error
      }

      // 3. Invalidar la query para refrescar la vista instantáneamente
      await queryClient.invalidateQueries({
        queryKey: ["socioLegajoCompleto", socioIdActivo],
      });

      if (resEnriquecimiento?.afipFailed) {
        toast.warning(
          "Legajo sincronizado, pero no se pudieron obtener todos los datos de AFIP (se utilizaron datos de LUFE o locales como fallback).",
          { id: toastId, duration: 6000 }
        );
      } else {
        toast.success("Legajo sincronizado correctamente desde LUFE/AFIP", { id: toastId });
      }
    } catch (err) {
      const errorMsg = obtenerMensajeAmigable(err, "Error al sincronizar datos desde LUFE/AFIP.");
      toast.error(errorMsg, { id: toastId });
    } finally {
      setSincronizando(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <section className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.iconCircleSmall}>
            <FiUsersIcon />
          </div>
          <div className={styles.titleWrapper}>
            <h1 className={styles.title}>Legajo</h1>
            <p className={styles.subtitle}>
              Completá los datos de tu empresa y de las personas
              vinculadas a ella.
            </p>
          </div>
        </div>

        {hayLegajoRequerido && (
          <div className={styles.lufeAction}>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className={styles.submitBtn}
              onClick={() => setShowConfirmModal(true)}
              disabled={sincronizando}
            >
              <FiRefreshCw
                style={{
                  marginRight: "0.5rem",
                  animation: sincronizando ? "spin 1s linear infinite" : "none"
                }}
              />
              {sincronizando ? "Sincronizando..." : "Consultar a LUFE"}
            </Button>
            <InfoTooltip
              label="¿Qué es LUFE?"
              texto="LUFE es una fuente de datos externa que usamos para completar automáticamente la información de tu empresa (socios, representantes y documentación)."
            />
          </div>
        )}
      </header>

      <LegajoUniversalBar context="legajo" />

      <div className={styles.formLayout}>
        <SociosLegajo />
      </div>

      <HelpDrawer
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        contexto="inicio"
      />

      <ConfirmacionModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleRefrescarLufe}
        titulo="Consultar a LUFE"
        mensaje="¿Estás seguro de que deseas sincronizar los datos de esta empresa con LUFE y AFIP? Esta acción actualizará la información de las personas vinculadas a tu empresa."
      />
    </section>
  );
}
