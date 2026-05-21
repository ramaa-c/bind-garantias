import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FiFileText, FiSmartphone } from "react-icons/fi";
import { InputFlotante, Button } from "../../../../ui"; // Cambiamos a InputFlotante y sacamos ContenedorPaso
import styles from "./PasoDetalles.module.css";

export default function PasoDetalles({ onContinuar }) {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext();

  const tipoCheque = useWatch({ control, name: "tipoCheque" });

  const handleSelectTipo = (tipo) => {
    setValue("tipoCheque", tipo, { shouldValidate: true });
    // Limpiar campos condicionales al cambiar
    if (tipo === "fisico") {
      setValue("idCoelsa", "");
    } else {
      setValue("cmc7", "");
    }
  };

  return (
    <div className={styles.container}>
      {/* --- CABECERA ESTILO PASO 4 Y EMISOR --- */}
      <div className={styles.headerTitleRow}>
        <h3 className={styles.headerTitle}>Detalles del Cheque</h3>
        <p className={styles.helperText}>
          Seleccioná el formato de tu cheque y completá los datos requeridos.
        </p>
      </div>

      <div className={styles.formContainer}>
        {/* --- TARJETAS RADIO --- */}
        <div className={styles.radioGroup}>
          {/* Opción Cheque Físico */}
          <div
            className={`${styles.radioCard} ${tipoCheque === "fisico" ? styles.selected : ""
              }`}
            onClick={() => handleSelectTipo("fisico")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSelectTipo("fisico");
              }
            }}
          >
            <FiFileText className={styles.radioIcon} />
            <span className={styles.radioLabel}>Cheque Físico</span>
          </div>

          {/* Opción eCheck */}
          <div
            className={`${styles.radioCard} ${tipoCheque === "echeck" ? styles.selected : ""
              }`}
            onClick={() => handleSelectTipo("echeck")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSelectTipo("echeck");
              }
            }}
          >
            <FiSmartphone className={styles.radioIcon} />
            <span className={styles.radioLabel}>eCheck</span>
          </div>
        </div>
        {errors.tipoCheque && (
          <span className={styles.errorText}>{errors.tipoCheque.message}</span>
        )}

        {/* --- FORMULARIO DINÁMICO --- */}
        <div className={styles.dynamicForm}>
          {tipoCheque === "fisico" && (
            <div className={styles.inputAnim}>
              <InputFlotante
                label="Número CMC7"
                id="cmc7"
                error={errors.cmc7?.message}
                {...register("cmc7")}
              />
            </div>
          )}

          {tipoCheque === "echeck" && (
            <div className={styles.inputAnim}>
              <InputFlotante
                label="ID de Coelsa"
                id="idCoelsa"
                error={errors.idCoelsa?.message}
                {...register("idCoelsa")}
              />
            </div>
          )}

          {/* Ocultamos el textarea si no seleccionó ningún tipo todavía */}
          {tipoCheque && (
            <div className={styles.textareaWrapper}>
              <label className={styles.label}>
                Mensaje para el equipo <span className={styles.optional}>(opcional)</span>
              </label>
              <textarea
                className={styles.textarea}
                placeholder="¿Hay algo más que debamos saber sobre este cheque?"
                {...register("mensaje")}
                rows={4}
              />
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="primary" onClick={onContinuar}>
            FINALIZAR
          </Button>
        </div>
      </div>
    </div>
  );
}