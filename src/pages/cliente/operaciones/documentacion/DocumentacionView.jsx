import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { FaFileAlt, FaSave, FaFileUpload } from "react-icons/fa";
import { DocumentosLegajo } from "../../../../components/features";
import { ConfirmacionModal } from "../../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { socioArchivoService } from "../../../../services/socioArchivoService";
import { toast } from "sonner";
import { Button } from "../../../../components/ui";
import { HelpDrawer } from "../../../../components/layout/Client/HelpDrawer/HelpDrawer";
import styles from "./DocumentacionView.module.css";

const DOC_TITLES = {
  estatuto: "Estatuto Social",
  balance: "Último Balance",
  acta: "Acta de Autoridades / DDJJ IVA",
  cartasDocumento: "Cartas Documento",
  poderes: "Poderes",
  certificadoPyme: "Certificado de PyME",
  otrosDocumentos: "Otros documentos",
};

export default function DocumentacionView() {
  const { socioIdActivo } = useEmpresaActiva();
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsHelpOpen((prev) => !prev);
    document.addEventListener("bindHelp:toggle", handler);
    return () => document.removeEventListener("bindHelp:toggle", handler);
  }, []);

  const methods = useForm({
    mode: "onChange",
    defaultValues: {
      estatuto: null,
      balance: null,
      acta: null,
      cartasDocumento: null,
      poderes: null,
      certificadoPyme: null,
      otrosDocumentos: null,
      intentoAvanzar: false,
    },
  });

  const onSubmit = (data) => {
    setPendingData(data);
    setConfirmOpen(true);
  };

  const realizarGuardado = async (data) => {
    if (!socioIdActivo) {
      toast.error("No se pudo identificar la empresa activa.");
      return;
    }

    const toastId = toast.loading("Guardando legajo digital...");
    try {
      const archivosExistentes =
        await socioArchivoService.obtenerArchivos(socioIdActivo);

      const llavesDocumentos = [
        "estatuto",
        "balance",
        "acta",
        "cartasDocumento",
        "poderes",
        "certificadoPyme",
        "otrosDocumentos",
      ];
      const pendientes = [];

      for (const key of llavesDocumentos) {
        const file = data[key];
        if (file && !file._uploaded) {
          pendientes.push({ key, file });
        }
      }

      if (pendientes.length === 0) {
        toast.success("Legajo guardado", {
          id: toastId,
          description: "Los cambios se guardaron correctamente.",
        });
        return;
      }

      for (const { key, file } of pendientes) {
        const docTitle = DOC_TITLES[key] || key;
        const specificId = data[`${key}_backendId`];
        const resultado = await socioArchivoService.subirOActualizar(
          socioIdActivo,
          file,
          key,
          archivosExistentes,
          docTitle,
          specificId,
        );

        if (resultado) {
          file._uploaded = true;
          file._backendId = resultado.socioarchivoid || resultado.id;
          methods.setValue(key, file);
        }
      }

      const desc =
        pendientes.length === 1
          ? "Se subió 1 documento correctamente."
          : `Se subieron ${pendientes.length} documentos correctamente.`;

      toast.success("Legajo guardado exitosamente", {
        id: toastId,
        description: desc,
      });
    } catch (error) {
      console.error("Fallo al actualizar el legajo digital:", error);
      toast.error("Error al guardar legajo", {
        id: toastId,
        description:
          "Ocurrió un error al subir los archivos. Por favor, reintente.",
      });
    }
  };

  const handleConfirmSave = async () => {
    setConfirmOpen(false);
    if (!pendingData) return;

    setGuardando(true);
    await realizarGuardado(pendingData);
    setGuardando(false);
  };

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

        <Button
          type="submit"
          variant="primary"
          size="sm"
          form="legajo-form"
          className={styles.submitBtn}
          onClick={() => methods.setValue("intentoAvanzar", true)}
          disabled={methods.formState.isSubmitting || guardando || !methods.formState.isDirty}
        >
          <FaSave style={{ marginRight: "0.5rem" }} />
          {methods.formState.isSubmitting || guardando ? "Actualizando..." : "Actualizar legajo"}
        </Button>
      </header>

      <FormProvider {...methods}>
        <form
          id="legajo-form"
          onSubmit={methods.handleSubmit(onSubmit)}
          className={styles.formLayout}
          noValidate
        >
          <DocumentosLegajo />
        </form>
      </FormProvider>

      <ConfirmacionModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSave}
        titulo="Guardar legajo digital"
        mensaje="¿Estás seguro de que deseas guardar los cambios en tu legajo digital?"
        isLoading={guardando}
      />

      <HelpDrawer
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        contexto="inicio"
      />
    </section>
  );
}
