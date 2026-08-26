import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useParams } from "react-router-dom";
import { FaFileAlt, FaFileUpload } from "react-icons/fa";
import { useQueryClient } from "@tanstack/react-query";
import { FiRefreshCw } from "react-icons/fi";
import { toast } from "sonner";
import {
  DocumentosLegajo,
  LegajoUniversalBar,
} from "../../../../components/features";
import { ESTRUCTURA_LEGAJO } from "../../../../components/features/shared/DocumentosLegajo/DocumentosLegajo";
import { ConfirmacionModal } from "../../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { useNavigationStore } from "../../../../store/useNavigationStore";
import { HelpDrawer } from "../../../../components/layout/Client/HelpDrawer/HelpDrawer";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { useRequisitos } from "../../../../hooks/useRequisitos";
import { sociosService } from "../../../../services/sociosService";
import { obtenerMensajeAmigable } from "../../../../utils/mensajesError";
import { Button, InfoTooltip } from "../../../../components/ui";
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
  const queryClient = useQueryClient();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const handler = () => setIsHelpOpen((prev) => !prev);
    document.addEventListener("bindHelp:toggle", handler);
    return () => document.removeEventListener("bindHelp:toggle", handler);
  }, []);

  const { socioIdActivo, cuitActivo, tipoPersonaId, nombreEmpresa } = useEmpresaActiva();

  // Determina si hay algo por lo que valga la pena mostrar "Consultar a
  // LUFE" en el header: mismo criterio que estructuraFiltrada en
  // DocumentosLegajo.jsx (ESTRUCTURA_LEGAJO filtrado por
  // requisitos.documentos), pero calculado acá aparte porque el botón vive
  // en este header, no adentro de <DocumentosLegajo/>. useRequisitos cachea
  // por queryKey (cadenaId, tipoPersonaId, sociedad), así que llamarlo acá
  // y de nuevo adentro de DocumentosLegajo no duplica el pedido de red.
  // Mientras requisitos todavía no cargó, se asume que sí hay documentación
  // (default más seguro que ocultar el botón y hacerlo aparecer después).
  const { cadenaSlug } = useParams();
  const cadenaId = Number(cadenaSlug) || 1;
  const { requisitos } = useRequisitos(cadenaId, tipoPersonaId, nombreEmpresa);
  const hayDocumentacionRequerida = ESTRUCTURA_LEGAJO.some(
    (item) => requisitos?.documentos?.[item.key] !== 0,
  );

  // Mismo botón/lógica que "Actualizar datos vía LUFE" en SociosView.jsx,
  // pero acotado a documentos: acá no corresponde re-consultar autoridades
  // (accionistas/representantes) ni enriquecimiento AFIP, solo
  // api/lufe/documentos — que además de traer el listado, vincula (crea el
  // SocioArchivo) los que todavía no estén cargados.
  const handleActualizarLufe = async () => {
    if (!socioIdActivo || !cuitActivo) {
      toast.error("No se pudo identificar la empresa activa.");
      return;
    }

    setSincronizando(true);
    setShowConfirmModal(false);
    const toastId = toast.loading("Actualizando documentos desde LUFE...");
    try {
      await sociosService.obtenerDocumentosLufe(cuitActivo, true);
      await queryClient.invalidateQueries({
        queryKey: ["socioArchivos", socioIdActivo],
      });
      toast.success("Documentos actualizados correctamente desde LUFE", { id: toastId });
    } catch (err) {
      const errorMsg = obtenerMensajeAmigable(err, "Error al actualizar documentos desde LUFE.");
      toast.error(errorMsg, { id: toastId });
    } finally {
      setSincronizando(false);
      setShowConfirmModal(false);
    }
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
            <h1 className={styles.title}>Documentación</h1>
            <p className={styles.subtitle}>
              Cargá y mantené actualizada la documentación de tu
              empresa.
            </p>
          </div>
        </div>

        {hayDocumentacionRequerida && (
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
                  animation: sincronizando ? "spin 1s linear infinite" : "none",
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

      <ConfirmacionModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleActualizarLufe}
        titulo="Consultar a LUFE"
        mensaje="¿Estás seguro de que deseas actualizar los documentos de esta empresa desde LUFE? Esta acción puede agregar documentos nuevos al legajo."
      />
    </section>
  );
}
