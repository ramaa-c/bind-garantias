import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { FiBriefcase, FiCreditCard } from "react-icons/fi";
import { toast } from "sonner";
import { Button } from "../../../../../ui/Button/Button";
import { Modal } from "../../../../../ui/Modal/Modal";
import { SelectSocio } from "../../../../../ui/SelectSocio/SelectSocio";
import { InputSocioMasked } from "../../../../../ui/InputSocioMasked/InputSocioMasked";
import { useObtenerTerceros } from "../../../../../../hooks/useTerceros";
import { tercerosService } from "../../../../../../services/tercerosService";
import { ConfirmacionModal } from "../../../ConfirmacionModal/ConfirmacionModal";
import styles from "./BolsaModal.module.css";

export function BolsaModal({ isOpen, onClose, onSuccess, agenteBolsa, socioIdActivo }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) setShowConfirm(false);
  }
  const { data: agentesData, isLoading: cargandoAgentes } = useObtenerTerceros({
    TipoTerceroRelacionadoID: 8,
  });

  const { control, setValue, reset, trigger, getValues, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      sociedadBolsa: "",
      numeroCuentaBolsa: "",
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (agenteBolsa) {
        reset({
          sociedadBolsa: String(agenteBolsa.id),
          numeroCuentaBolsa: agenteBolsa.nrosubcuentacaja,
        });
      } else {
        reset({
          sociedadBolsa: "",
          numeroCuentaBolsa: "",
        });
      }
    }
  }, [isOpen, agenteBolsa, reset]);

  const handlePreSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isValid = await trigger();
    if (!isValid) return;

    if (!isDirty) {
      onClose();
      return;
    }

    setShowConfirm(true);
  };

  const onConfirmSave = async () => {
    const formData = getValues();
    try {
      const ahora = new Date().toISOString().split(".")[0];
      const unAnioMas = new Date();
      unAnioMas.setFullYear(unAnioMas.getFullYear() + 1);
      const unAnioMasStr = unAnioMas.toISOString().split(".")[0];

      if (agenteBolsa?.relacionId) {
        const payloadRel = {
          ...agenteBolsa?.relacion,
          nrosubcuentacaja: String(formData.numeroCuentaBolsa),
          momento: ahora,
        };
        delete payloadRel.provinciaid;
        delete payloadRel.ProvinciaID;
        await tercerosService.actualizarRelacionDeSocio(payloadRel);
        toast.success("Cuenta comitente actualizada correctamente.");
      } else {
        const payloadRel = {
          socioid: socioIdActivo,
          tercerosrelacionados: [
            {
              sociotercerorelacionid: 0,
              socioid: socioIdActivo,
              terceroid: Number(formData.sociedadBolsa),
              tiporelacionsocioid: 21,
              fechadesde: ahora,
              fechahasta: unAnioMasStr,
              porcacciones: 0,
              nroinscripcion: "",
              condicionescomerciales: "",
              cbu: "",
              nrosubcuentacaja: String(formData.numeroCuentaBolsa),
              sucursalid: 0,
              default: "1",
              subtiporelacionsocioid: 0,
              telefono: "",
              momento: ahora,
            },
          ],
        };
        await tercerosService.guardarRelacionesDeSocio(payloadRel);
        toast.success("Agente de bolsa vinculado exitosamente.");
      }

      if (onSuccess) onSuccess();
      setShowConfirm(false);
      onClose();
    } catch (error) {
      setShowConfirm(false);
      if (error?.response?.status === 400 && error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        Object.keys(backendErrors).forEach((key) => {
          toast.error(backendErrors[key]);
        });
      } else {
        toast.error("Ocurrió un error inesperado al guardar los datos.");
      }
    }
  };

  const rawAgentes = agentesData?.items || agentesData?.data || agentesData || [];
  const opcionesAgentes = Array.isArray(rawAgentes)
    ? rawAgentes.map((a) => ({
        value: String(a.tercerorelacionadoid || a.id),
        label: a.denominacion || a.Denominacion || a.razonsocial || a.nombre || "Sociedad de Bolsa",
      }))
    : [];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={agenteBolsa ? "Editar Agente de Bolsa" : "Vincular Agente de Bolsa"}
        maxWidth="500px"
      >
        <form onSubmit={handlePreSubmit} className={styles.modalForm}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Controller
              name="sociedadBolsa"
              control={control}
              rules={{ required: "La sociedad de bolsa es obligatoria" }}
              render={({ fieldState }) => (
                <SelectSocio
                  control={control}
                  name="sociedadBolsa"
                  label={cargandoAgentes ? "Cargando sociedades..." : "Sociedad de Bolsa"}
                  icon={<FiBriefcase />}
                  options={opcionesAgentes}
                  disabled={cargandoAgentes || !!agenteBolsa}
                  isLoading={cargandoAgentes}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="numeroCuentaBolsa"
              control={control}
              rules={{ required: "El número de cuenta es obligatorio" }}
              render={({ field, fieldState }) => (
                <InputSocioMasked
                  value={field.value}
                  onChange={(val) => setValue("numeroCuentaBolsa", val, { shouldDirty: true, shouldValidate: true })}
                  onBlur={field.onBlur}
                  label="Número de Cuenta Comitente"
                  icon={<FiCreditCard />}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>

          <div className={styles.modalFooter}>
            <Button type="submit" variant="primary" disabled={cargandoAgentes}>
              {agenteBolsa ? "Guardar Cambios" : "Vincular Agente"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmacionModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={onConfirmSave}
        titulo={agenteBolsa ? "Actualizar Agente" : "Vincular Agente"}
        mensaje={agenteBolsa ? "¿Estás seguro de que deseas guardar los cambios?" : "¿Estás seguro de que deseas vincular este agente de bolsa?"}
      />
    </>
  );
}
