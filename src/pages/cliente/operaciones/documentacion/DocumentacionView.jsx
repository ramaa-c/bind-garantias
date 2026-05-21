import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { DocumentosLegajo } from "../../../../components/features";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { socioArchivoService } from "../../../../services/socioArchivoService";
import { toast } from "sonner";
import styles from "./DocumentacionView.module.css";

const DOC_TITLES = {
  certificadoPyme: "Certificado de PyME",
  poderes: "Poderes",
  otrosDocumentos: "Otros documentos",
};

export default function DocumentacionView() {
  const { socioIdActivo } = useEmpresaActiva();
  const methods = useForm({
    mode: "onChange",
    defaultValues: {
      certificadoPyme: null,
      poderes: null,
      otrosDocumentos: null,
      intentoAvanzar: false,
    },
  });

  const onSubmit = async (data) => {
    if (!socioIdActivo) {
      toast.error("No se pudo identificar la empresa activa.");
      return;
    }

    const toastId = toast.loading("Guardando legajo digital...");
    try {
      // 1. Obtener archivos existentes del backend para ver si actualizamos o creamos
      const archivosExistentes = await socioArchivoService.obtenerArchivos(socioIdActivo);

      // 2. Filtrar archivos pendientes de subida
      const llavesDocumentos = ["certificadoPyme", "poderes", "otrosDocumentos"];
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

      // 3. Subir de forma secuencial cada archivo pendiente
      for (const { key, file } of pendientes) {
        const docTitle = DOC_TITLES[key] || key;
        const specificId = data[`${key}_backendId`];
        const resultado = await socioArchivoService.subirOActualizar(
          socioIdActivo,
          file,
          key,
          archivosExistentes,
          docTitle,
          specificId
        );
        
        // Marcar en el estado local que ya fue subido
        if (resultado) {
          file._uploaded = true;
          file._backendId = resultado.socioarchivoid || resultado.id;
          methods.setValue(key, file);
        }
      }

      toast.success("Legajo guardado exitosamente", {
        id: toastId,
        description: `Se subieron ${pendientes.length} documento(s) correctamente.`,
      });
    } catch (error) {
      console.error("Fallo al actualizar el legajo digital:", error);
      toast.error("Error al guardar legajo", {
        id: toastId,
        description: "Ocurrió un error al subir los archivos. Por favor, reintente.",
      });
    }
  };

  return (
    <section className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Tu perfil digital</h1>
        <p className={styles.subtitle}>
          Gestioná y mantené actualizados los datos corporativos y documentos operativos.
        </p>
      </header>

      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className={styles.formLayout}
          noValidate
        >
          <DocumentosLegajo />

          <div className={styles.actionsContainer}>
            <button
              type="submit"
              className={styles.submitBtn}
              onClick={() => methods.setValue("intentoAvanzar", true)}
              disabled={methods.formState.isSubmitting}
            >
              {methods.formState.isSubmitting
                ? "Guardando..."
                : "Guardar Legajo"}
            </button>
          </div>
        </form>
      </FormProvider>
    </section>
  );
}