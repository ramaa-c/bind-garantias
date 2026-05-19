import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { DocumentosLegajo } from "../../../../components/features";
import styles from "./DocumentacionView.module.css";

export default function DocumentacionView() {
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
    try {
      // Guardar legajo digital
    } catch (error) {
      console.error("Fallo al actualizar el legajo digital:", error);
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