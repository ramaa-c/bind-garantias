import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FiUsers as FiUsersIcon, FiRefreshCw } from "react-icons/fi";
import { SociosLegajo } from "../../../../components/features";
import { Button } from "../../../../components/ui";
import { HelpDrawer } from "../../../../components/layout/Client/HelpDrawer/HelpDrawer";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { sociosService } from "../../../../services/sociosService";
import { enriquecerSociosLufeAfip } from "../../../../utils/enriquecimiento";
import { toast } from "sonner";
import styles from "./SociosView.module.css";

export default function SociosView() {
  const queryClient = useQueryClient();
  const { socioIdActivo, cuitActivo } = useEmpresaActiva();
  const [sincronizando, setSincronizando] = useState(false);
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
    const toastId = toast.loading("Sincronizando legajo con LUFE y AFIP...");
    try {
      console.log(`[SociosView] Iniciando precarga y enriquecimiento de autoridades/accionistas para CUIT: ${cuitActivo}`);

      // 1. Ejecutar la precarga LUFE + enriquecimiento síncrono AFIP + PUTs de accionistas
      await enriquecerSociosLufeAfip(socioIdActivo, cuitActivo);

      // 2. Vincular documentos de LUFE
      try {
        console.log(`[SociosView] Vinculando documentos de LUFE para CUIT: ${cuitActivo}`);
        await sociosService.obtenerDocumentosLufe(cuitActivo, true);
      } catch (lufeDocsError) {
        console.error("[SociosView] Error al vincular documentos de LUFE:", lufeDocsError);
      }

      // 3. Invalidar la query para refrescar la vista instantáneamente
      await queryClient.invalidateQueries({
        queryKey: ["socioLegajoCompleto", socioIdActivo],
      });

      toast.success("Legajo sincronizado correctamente desde LUFE/AFIP", { id: toastId });
    } catch (err) {
      console.error("[SociosView] Error al sincronizar legajo:", err);
      toast.error("Error al sincronizar datos desde LUFE/AFIP.", { id: toastId });
    } finally {
      setSincronizando(false);
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
          onClick={handleRefrescarLufe}
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
    </section>
  );
}
