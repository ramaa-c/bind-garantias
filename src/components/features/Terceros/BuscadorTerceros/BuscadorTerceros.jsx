import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { FiSearch, FiHash, FiX } from "react-icons/fi";
import { InputSocioMasked, Button } from "../../../ui";
import { useBuscarTerceroPorCuit } from "../../../../hooks/useTerceros";
import { CUIT_REGEX } from "../../../../utils/validators";
import styles from "./BuscadorTerceros.module.css";

export const BuscadorTerceros = ({
  onEncontrado,
  onNoEncontrado,
  onCancelar,
}) => {
  const {
    control,
    trigger,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: { cuitBusqueda: "" },
    mode: "onChange",
  });

  const cuitActual = useWatch({ control, name: "cuitBusqueda" });
  const mutacionBuscar = useBuscarTerceroPorCuit();

  const manejarBusqueda = async () => {
    const esValido = await trigger("cuitBusqueda");

    if (esValido) {
      const cuitIngresado = getValues("cuitBusqueda");

      const resultados = await mutacionBuscar
        .mutateAsync(cuitIngresado)
        .catch((error) => {
          if (error.response?.status === 404) {
            return null;
          }
          throw error;
        });

      if (resultados) {
        if (resultados.length > 0) {
          onEncontrado(resultados[0]);
        } else {
          onNoEncontrado(cuitIngresado);
        }
      } else {
        onNoEncontrado(cuitIngresado);
      }
    }
  };

  const errorEs404 = mutacionBuscar.error?.response?.status === 404;
  const mostrarErrorRed = mutacionBuscar.isError && !errorEs404;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Buscar Tercero</h3>
        <p className={styles.subtitle}>
          Ingresá el CUIT para verificar si la persona o empresa ya está
          registrada en el padrón.
        </p>
      </div>

      <div className={styles.formContainer}>
        <div className={styles.inputContainer}>
          <InputSocioMasked
            name="cuitBusqueda"
            control={control}
            rules={{
              required: "El CUIT es obligatorio",
              pattern: {
                value: CUIT_REGEX,
                message: "Deben ser 11 números exactos",
              },
            }}
            label="Buscar por CUIT (Sin guiones)"
            type="number"
            icon={<FiHash />}
            esValido={CUIT_REGEX.test(cuitActual) && !errors.cuitBusqueda}
            error={errors.cuitBusqueda?.message}
          />
        </div>

        {mostrarErrorRed && (
          <p className={styles.errorText}>
            Hubo un problema al conectar con el servidor. Intentá nuevamente.
          </p>
        )}

        <div className={styles.actions}>
          <Button
            type="button"
            variant="outline"
            onClick={onCancelar}
            disabled={mutacionBuscar.isPending}
          >
            <FiX style={{ marginRight: "0.5rem" }} /> CANCELAR
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={manejarBusqueda}
            disabled={mutacionBuscar.isPending || !CUIT_REGEX.test(cuitActual)}
          >
            <FiSearch style={{ marginRight: "0.5rem" }} />
            {mutacionBuscar.isPending ? "BUSCANDO..." : "BUSCAR EN PADRÓN"}
          </Button>
        </div>
      </div>
    </div>
  );
};
