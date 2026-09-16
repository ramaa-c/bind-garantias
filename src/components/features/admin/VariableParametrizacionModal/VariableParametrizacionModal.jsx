import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "../../../ui/Modal/Modal";
import styles from "./VariableParametrizacionModal.module.css";
import { Button } from "../../../ui/Button/Button";
import { InputSimple } from "../../../ui/InputSimple/InputSimple";
import {
  useCrearVariableParametrizacion,
  useActualizarVariableParametrizacion,
} from "../../../../hooks/useVariablesParametrizacion";

// Alta y edición de una variable parametrizable (api/VariablesParametrizacion).
// En alta se define el nombre y el valor inicial; en edición el nombre queda
// fijo (no se puede renombrar, mismo criterio que el ID en
// TipoRelacionSocioModal) y solo se puede tocar el Valor.
export const VariableParametrizacionModal = ({
  isOpen,
  onClose,
  itemEditar,
}) => {
  const esEdicion = !!itemEditar;

  const [variable, setVariable] = useState("");
  const [valor, setValor] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setVariable(itemEditar?.variable || "");
    setValor(itemEditar ? String(itemEditar.valor ?? "") : "");
  }, [isOpen, itemEditar]);

  const { mutate: crear, isPending: isCreando } =
    useCrearVariableParametrizacion();
  const { mutate: actualizar, isPending: isActualizando } =
    useActualizarVariableParametrizacion();
  const isGuardando = isCreando || isActualizando;

  const puedeGuardar =
    valor.trim().length > 0 &&
    !Number.isNaN(Number(valor)) &&
    (esEdicion || variable.trim().length > 0);

  const handleGuardar = () => {
    if (!puedeGuardar) return;

    const payload = esEdicion
      ? {
          variablesparametrizacionid: itemEditar.variablesparametrizacionid,
          variable: itemEditar.variable,
          valor: Number(valor),
        }
      : {
          variable: variable.trim(),
          valor: Number(valor),
        };

    const onSuccess = () => {
      toast.success(
        esEdicion
          ? "Variable actualizada correctamente"
          : "Variable creada correctamente",
      );
      onClose();
    };
    const onError = (error) => {
      console.error(
        "[VariableParametrizacionModal] Error al guardar:",
        error,
      );
      toast.error("Ocurrió un error al guardar la variable");
    };

    if (esEdicion) {
      actualizar(payload, { onSuccess, onError });
    } else {
      crear(payload, { onSuccess, onError });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? "Editar variable" : "Agregar variable"}
      subtitle={
        esEdicion
          ? "Solo se puede modificar el valor. El nombre de la variable no cambia."
          : "Definí el nombre y el valor inicial de la nueva variable parametrizable."
      }
      maxWidth="480px"
      variant="blue"
      preventClose={isGuardando}
      footer={
        <>
          <Button
            variant="outlineBlue"
            size="sm"
            onClick={onClose}
            disabled={isGuardando}
          >
            CANCELAR
          </Button>
          <Button
            variant="blue"
            size="sm"
            onClick={handleGuardar}
            isLoading={isGuardando}
            disabled={isGuardando || !puedeGuardar}
          >
            GUARDAR
          </Button>
        </>
      }
    >
      <div className={styles.campos}>
        {esEdicion ? (
          <InputSimple
            label="Variable"
            value={itemEditar.variable}
            disabled
          />
        ) : (
          <InputSimple
            label="Nombre de la variable"
            value={variable}
            onChange={setVariable}
            variant="admin"
          />
        )}

        <InputSimple
          label="Valor"
          value={valor}
          onChange={setValor}
          variant="admin"
        />
      </div>
    </Modal>
  );
};

export default VariableParametrizacionModal;
