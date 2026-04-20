import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { FiSearch, FiHash, FiX } from "react-icons/fi";
import { InputSocioMasked, Button } from "../../../ui";
import { useBuscarTerceroPorCuit } from "../../../../hooks/useTerceros";

const CUIT_REGEX = /^\d{11}$/;

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
      try {
        const resultados = await mutacionBuscar.mutateAsync(cuitIngresado);

        if (resultados && resultados.length > 0) {
          onEncontrado(resultados[0]);
        } else {
          onNoEncontrado(cuitIngresado);
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          onNoEncontrado(cuitIngresado);
        } else {
          console.error("Error al buscar el CUIT:", error);
        }
      }
    }
  };

  const errorEs404 = mutacionBuscar.error?.response?.status === 404;
  const mostrarErrorRed = mutacionBuscar.isError && !errorEs404;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ borderBottom: "1px solid #333", paddingBottom: "1rem" }}>
        <h3 style={{ color: "var(--white)", margin: "0 0 0.5rem 0" }}>
          Buscar Tercero
        </h3>
        <p style={{ color: "#aaa", margin: 0, fontSize: "0.95rem" }}>
          Ingresá el CUIT para verificar si la persona o empresa ya está
          registrada en el padrón.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ maxWidth: "400px" }}>
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
          <p style={{ color: "#ff4444", margin: 0, fontSize: "0.9rem" }}>
            Hubo un problema al conectar con el servidor. Intentá nuevamente.
          </p>
        )}

        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
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
