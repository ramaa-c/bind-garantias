import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { FaFileAlt, FaFileUpload } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { FiDownload } from "react-icons/fi";
import { toast } from "sonner";
import {
  DocumentosLegajo,
  LegajoUniversalBar,
} from "../../../../components/features";
import { ESTRUCTURA_LEGAJO } from "../../../../components/features/shared/DocumentosLegajo/DocumentosLegajo";
import { useNavigationStore } from "../../../../store/useNavigationStore";
import { HelpDrawer } from "../../../../components/layout/Client/HelpDrawer/HelpDrawer";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { socioArchivoService } from "../../../../services/socioArchivoService";
import { descargarLegajoCompletoZip } from "../../../../utils/fileUtils";
import { Button } from "../../../../components/ui";
import styles from "./DocumentacionView.module.css";

const DOC_TITLES = {
  estatuto: "Estatuto Social",
  balance: "Último Balance",
  ddjjIva: "Declaración Jurada de IVA",
  cartasDocumento: "Cartas Documento",
  poderes: "Poderes",
  certificadoPyme: "Certificado de PyME",
  otrosDocumentos: "Otros documentos",
  eecc: "Estados Contables (EECC)",
  actaDesignacion: "Acta de Designación de Autoridades",
  actaSocios: "Acta de Reunión de Socios",
  f1272: "Formulario F1272",
  ddjjGanancias: "DDJJ de Ganancias",
  manifestacionBienes: "Manifestación de Bienes",
  constanciaMonotributo: "Constancia de Monotributo",
};

export default function DocumentacionView() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsHelpOpen((prev) => !prev);
    document.addEventListener("bindHelp:toggle", handler);
    return () => document.removeEventListener("bindHelp:toggle", handler);
  }, []);

  const { socioIdActivo, nombreEmpresa } = useEmpresaActiva();

  const { data: archivosBackend = [] } = useQuery({
    queryKey: ["socioArchivos", socioIdActivo],
    queryFn: () => socioArchivoService.obtenerArchivos(socioIdActivo),
    enabled: !!socioIdActivo,
    staleTime: 1000 * 60 * 5,
  });

  const handleDownloadAllZip = () => {
    if (archivosBackend.length === 0) {
      toast.error("No hay archivos cargados para descargar.");
      return;
    }
    const cleanRazonSocial = (nombreEmpresa || "Empresa").replace(/\s+/g, "_");
    const zipName = `Legajo_Completo_${cleanRazonSocial}.zip`;
    descargarLegajoCompletoZip(
      archivosBackend,
      ESTRUCTURA_LEGAJO,
      socioArchivoService.TIPO_DOCUMENTO_MAP,
      zipName
    );
  };

  const methods = useForm({
    mode: "onChange",
    defaultValues: {
      estatuto: null,
      balance: null,
      ddjjIva: null,
      cartasDocumento: null,
      poderes: null,
      certificadoPyme: null,
      otrosDocumentos: null,
      eecc: null,
      actaDesignacion: null,
      actaSocios: null,
      f1272: null,
      ddjjGanancias: null,
      manifestacionBienes: null,
      constanciaMonotributo: null,
      intentoAvanzar: false,
    },
  });

  const { setUnsavedChanges } = useNavigationStore();

  useEffect(() => {
    return () => setUnsavedChanges(false);
  }, [setUnsavedChanges]);

  return (
    <section className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.iconCircleSmall}>
            <FaFileUpload />
          </div>
          <div className={styles.titleWrapper}>
            <h1 className={styles.title}>Tu perfil digital</h1>
            <p className={styles.subtitle}>
              Gestioná y mantené actualizados los datos corporativos y
              documentos operativos.
            </p>
          </div>
        </div>

        {archivosBackend.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={styles.downloadBtn}
            onClick={handleDownloadAllZip}
            title="Descargar legajo de documentos completo en un archivo ZIP"
          >
            <FiDownload style={{ marginRight: "0.5rem" }} />
            Descargar Legajo Completo
          </Button>
        )}
      </header>

      <LegajoUniversalBar context="documentacion" />

      <FormProvider {...methods}>
        <form
          id="legajo-form"
          className={styles.formLayout}
          noValidate
          onSubmit={(e) => e.preventDefault()}
        >
          <DocumentosLegajo />
        </form>
      </FormProvider>

      <HelpDrawer
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        contexto="inicio"
      />
    </section>
  );
}
