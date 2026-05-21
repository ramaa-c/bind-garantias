import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { FiSave, FiX, FiUserPlus } from "react-icons/fi";
import { Button, Alert } from "../../../ui";
import { SeccionDatos } from "../SeccionDatos/SeccionDatos";
import {
  useCrearTercero,
  useActualizarTercero,
} from "../../../../hooks/useTerceros";
import styles from "./Formulario.module.css";

export const Formulario = ({
  terceroExistente = null,
  cuitPreCargado = "",
  onGuardado,
  onCancelar,
}) => {
  const esEdicion = !!terceroExistente;

  const metodos = useForm({
    defaultValues: {
      denominacion: terceroExistente?.denominacion || "",
      cuit: terceroExistente?.cuit || cuitPreCargado || "",
      tipopersonaid: terceroExistente?.tipopersonaid?.toString() || "",
      mail: terceroExistente?.mail || "",
      telefono: terceroExistente?.telefono || "",
    },
    mode: "onChange",
  });

  const mutacionCrear = useCrearTercero();
  const mutacionActualizar = useActualizarTercero();

  const estaGuardando = mutacionCrear.isPending || mutacionActualizar.isPending;
  const errorGuardado = mutacionCrear.error || mutacionActualizar.error;

  const onSubmit = async (formData) => {
    const basePayload = esEdicion
      ? { ...terceroExistente }
      : { tercerorelacionadoid: 0 };

    const payload = {
      ...basePayload,
      denominacion: formData.denominacion,
      cuit: formData.cuit,
      tipopersonaid: Number(formData.tipopersonaid) || 0,
      mail: formData.mail,
      telefono: formData.telefono,
    };

    try {
      let terceroFinal;
      if (esEdicion) {
        terceroFinal = await mutacionActualizar.mutateAsync(payload);
      } else {
        terceroFinal = await mutacionCrear.mutateAsync(payload);
      }

      onGuardado(terceroFinal);
    } catch (err) {
      console.error("Fallo al guardar el Tercero Relacionado:", err);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <FiUserPlus
          className={`${styles.icon} ${esEdicion ? styles.iconEdit : styles.iconCreate}`}
        />
        <div>
          <h2 className={styles.title}>
            {esEdicion ? "Editar Tercero Relacionado" : "Alta de Nuevo Tercero"}
          </h2>
          <p className={styles.subtitle}>
            {esEdicion
              ? `ID Padrón: ${terceroExistente.tercerorelacionadoid}`
              : "Registrando en el padrón unificado."}
          </p>
        </div>
      </header>

      <FormProvider {...metodos}>
        <form
          onSubmit={metodos.handleSubmit(onSubmit)}
          className={styles.form}
        >
          <SeccionDatos />

          {errorGuardado && (
            <Alert variant="error" className={styles.errorBox}>
              Error al {esEdicion ? "actualizar" : "crear"}:{" "}
              {errorGuardado.message}
            </Alert>
          )}

          <div className={styles.actions}>
            <Button
              type="button"
              variant="outline"
              onClick={onCancelar}
              disabled={estaGuardando}
            >
              <FiX style={{ marginRight: "0.5rem" }} /> CANCELAR
            </Button>

            <Button type="submit" variant="primary" disabled={estaGuardando}>
              <FiSave style={{ marginRight: "0.5rem" }} />
              {estaGuardando
                ? esEdicion
                  ? "ACTUALIZANDO..."
                  : "CREANDO..."
                : esEdicion
                  ? "GUARDAR TERCERO"
                  : "CREAR TERCERO"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};
