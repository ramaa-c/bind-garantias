import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { DocumentosLegajo } from "../../components/features";
import styles from "./DocumentacionView.module.css";

export default function DocumentacionView() {
  const methods = useForm({
    mode: "onChange",
    defaultValues: {
      email: "",
      celular: "",
      direccion: "",
      estatuto: null,
      balance: null,
      acta: null,
      poderes: null,
      intentoAvanzar: false,
    },
  });

  const onSubmit = async (data) => {
    try {
      console.info("Ejecutando mutación con payload:", data);
    } catch (error) {
      console.error("Fallo al actualizar documentación:", error);
    }
  };

  return (
    <section className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Documentación</h1>
        <p className={styles.subtitle}>
          Gestioná y mantené actualizados los documentos corporativos para
          operar.
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
