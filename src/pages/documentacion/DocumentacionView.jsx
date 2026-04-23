import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import Paso5Documentacion from "../../components/features/shared/Compartidos/Paso5Documentacion/Paso5Documentacion";
import styles from "./DocumentacionView.module.css";

export default function DocumentacionView() {
  const methods = useForm({
    mode: "onChange",
    defaultValues: {
      email: "",
      celular: "",
      direccion: "",
      dniFrente: null,
      dniDorso: null,
    },
  });

  const onSubmit = async (data) => {
    try {
      console.info("Ejecutando mutación PUT con payload:", data);
    } catch (error) {
      console.error("Fallo al actualizar documentación:", error);
    }
  };

  return (
    <section className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Documentación</h1>
        <p className={styles.subtitle}>
          Gestioná y mantené actualizados tus documentos y datos de contacto
          para operar.
        </p>
      </header>

      <main className={styles.contentWrapper}>
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className={styles.formLayout}
            noValidate
          >
            <Paso5Documentacion />

            <div className={styles.actionsContainer}>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={
                  !methods.formState.isValid || methods.formState.isSubmitting
                }
              >
                {methods.formState.isSubmitting
                  ? "Guardando..."
                  : "Guardar Documentación"}
              </button>
            </div>
          </form>
        </FormProvider>
      </main>
    </section>
  );
}
