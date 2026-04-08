import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FiFileText, FiSmartphone } from "react-icons/fi";
import { Input, Button, ContenedorPaso } from "../../../ui";
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
    <ContenedorPaso
      titulo="Detalles del Cheque"
      descripcion="Seleccioná el formato de tu cheque y completá los datos requeridos."
    >
      <div className={styles.radioGroup}>
        {/* Opción Cheque Físico */}
        <div
          className={`${styles.radioCard} ${
            tipoCheque === "fisico" ? styles.selected : ""
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
          className={`${styles.radioCard} ${
            tipoCheque === "echeck" ? styles.selected : ""
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

      <div className={styles.dynamicForm}>
        {tipoCheque === "fisico" && (
          <div className={styles.inputAnim}>
            <Input
              label="CMC7"
              placeholder="Ingresá los números del CMC7"
              error={errors.cmc7?.message}
              {...register("cmc7")}
            />
          </div>
        )}

        {tipoCheque === "echeck" && (
          <div className={styles.inputAnim}>
            <Input
              label="ID Coelsa"
              placeholder="Ingresá el ID de Coelsa"
              error={errors.idCoelsa?.message}
              {...register("idCoelsa")}
            />
          </div>
        )}

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
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="primary" onClick={onContinuar}>
          FINALIZAR
        </Button>
      </div>
    </ContenedorPaso>
  );
}
