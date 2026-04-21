import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { FiLink, FiCalendar, FiPercent, FiCheck, FiX } from "react-icons/fi";
import {
  SelectSocio,
  InputSocioMasked,
  Button,
  SelectFecha,
} from "../../../ui";
import { useTipoRelacionSocio } from "../../../../hooks/useCatalogos";
import { useGuardarRelacionesSocio } from "../../../../hooks/useTerceros";
import styles from "./FormularioVincular.module.css";

export const FormularioVincular = ({
  socioId,
  tercero,
  onVinculado,
  onCancelar,
}) => {
  const metodos = useForm({
    defaultValues: {
      tiporelacionsocioid: "",
      fechadesde: new Date().toISOString().split("T")[0],
      fechahasta: "",
      porcacciones: 0,
    },
    mode: "onChange",
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = metodos;

  const { data: relacionesData, isLoading: cargandoRelaciones } =
    useTipoRelacionSocio();
  const mutacionVincular = useGuardarRelacionesSocio();

  const relacionSeleccionada = watch("tiporelacionsocioid");
  const esAccionista =
    relacionSeleccionada === "25" || relacionSeleccionada === "1201";

  const onSubmit = async (formData) => {
    const payload = {
      socioid: socioId,
      tercerosrelacionados: [
        {
          sociotercerorelacionid: 0,
          socioid: socioId,
          terceroid: tercero.tercerorelacionadoid,
          tiporelacionsocioid: Number(formData.tiporelacionsocioid),
          fechadesde: formData.fechadesde,
          fechahasta: formData.fechahasta || null,
          porcacciones: esAccionista ? Number(formData.porcacciones) : 0,
          nroinscripcion: "",
          condicionescomerciales: "",
          cbu: "",
          provinciaid: 0,
          nrosubcuentacaja: "",
          sucursalid: 0,
          default: "",
          subtiporelacionsocioid: 0,
          telefono: tercero.telefono || "",
          momento: new Date().toISOString(),
        },
      ],
    };

    try {
      await mutacionVincular.mutateAsync(payload);
      onVinculado();
    } catch (err) {
      console.error("Error al establecer vínculo:", err);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h3 className={styles.title}>
          Vincular Tercero a Socio
        </h3>
        <p className={styles.subtitle}>
          Estableciendo relación con:{" "}
          <strong className={styles.highlight}>{tercero?.denominacion}</strong>
        </p>
      </header>

      <FormProvider {...metodos}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={styles.form}
        >
          <div className={styles.grid}>
            <SelectSocio
              name="tiporelacionsocioid"
              control={control}
              label={
                cargandoRelaciones
                  ? "Cargando roles..."
                  : "Rol / Tipo de Relación"
              }
              icon={<FiLink />}
              options={cargandoRelaciones ? [] : relacionesData?.opciones}
              disabled={cargandoRelaciones || mutacionVincular.isPending}
              error={errors.tiporelacionsocioid?.message}
            />

            <SelectFecha
              name="fechadesde"
              control={control}
              label="Vigente Desde"
              icon={<FiCalendar />}
              disabled={mutacionVincular.isPending}
            />

            {esAccionista && (
              <InputSocioMasked
                name="porcacciones"
                control={control}
                label="% de Acciones"
                type="number"
                icon={<FiPercent />}
                disabled={mutacionVincular.isPending}
              />
            )}
          </div>

          <div className={styles.actions}>
            <Button
              type="button"
              variant="outline"
              onClick={onCancelar}
              disabled={mutacionVincular.isPending}
            >
              <FiX style={{ marginRight: "0.5rem" }} /> CANCELAR
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={mutacionVincular.isPending}
            >
              <FiCheck style={{ marginRight: "0.5rem" }} />
              {mutacionVincular.isPending
                ? "VINCULANDO..."
                : "CONFIRMAR VÍNCULO"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};
