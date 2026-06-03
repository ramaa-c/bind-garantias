import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FiUsers as FiUsersIcon, FiRefreshCw } from "react-icons/fi";
import { SociosLegajo } from "../../../../components/features";
import { ConfirmacionModal } from "../../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { Button } from "../../../../components/ui";
import { HelpDrawer } from "../../../../components/layout/Client/HelpDrawer/HelpDrawer";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { sociosService } from "../../../../services/sociosService";
import { enriquecerSociosLufeAfip } from "../../../../utils/enriquecimiento";
import { toast } from "sonner";
import styles from "./SociosView.module.css";

const obtenerMensajeAmigable = (err, defaultMsg) => {
  if (err?.code === "ECONNABORTED" || err?.message?.toLowerCase().includes("timeout")) {
    return "El servicio externo está demorando en responder. Por favor, intentá nuevamente en unos momentos.";
  }
  if (err?.message?.toLowerCase().includes("network error") || !err?.response) {
    return "No se pudo conectar con el servidor. Verificá tu conexión a internet o reintentá más tarde.";
  }
  const status = err.response?.status;
  if (status >= 500) {
    return "Hubo un inconveniente en el sistema al procesar los datos. Por favor, reintentá más tarde.";
  }
  if (status === 404) {
    return "No se encontraron los datos correspondientes en el padrón.";
  }
  if (status === 403 || status === 401) {
    return "No tenés permisos para realizar esta consulta.";
  }
  if (status === 400) {
    const backendMessage = err.response?.data?.message || err.response?.data || err.response?.data?.title;
    if (typeof backendMessage === "string" && backendMessage.length < 150) {
      return backendMessage;
    }
    return "Los datos de la empresa no pudieron ser validados. Revisá el CUIT y reintentá.";
  }
  return defaultMsg;
};

export default function SociosView() {
  const queryClient = useQueryClient();
  const { socioIdActivo, cuitActivo } = useEmpresaActiva();
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
      // 1. Ejecutar la precarga LUFE + enriquecimiento síncrono AFIP + PUTs de accionistas
      const resEnriquecimiento = await enriquecerSociosLufeAfip(socioIdActivo, cuitActivo);

      // 2. Vincular documentos de LUFE
      try {
        await sociosService.obtenerDocumentosLufe(cuitActivo, true);
      } catch (lufeDocsError) {
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
              Gestioná la composición accionaria, representantes y
              vinculaciones.
            </p>
          </div>
        </div>

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
          {sincronizando ? "Sincronizando..." : "Refrescar datos LUFE"}
        </Button>
      </header>

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
        titulo="Refrescar datos LUFE"
        mensaje="¿Estás seguro de que deseas sincronizar los datos de esta empresa con LUFE y AFIP? Esta acción actualizará la composición accionaria y los representantes."
      />
    </section>
  );
}
