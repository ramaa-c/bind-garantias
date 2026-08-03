import { useEffect } from "react";

/**
 * Valida a mano que Calle, Provincia y Ciudad esten cargadas antes de guardar
 * un tercero (accionista/representante/apoderado). Estos modales arman su
 * formulario con `useForm()` sin resolver de zod, asi que nada bloqueaba
 * guardar con la ubicacion vacia - dato que despues hace falta completo para
 * la migracion a SGR+ (ver sociosService.enviarASgrPlus).
 *
 * Devuelve `validar()`, para llamar antes de confirmar el guardado; los 3
 * `useEffect` limpian el error apenas el usuario corrige el campo
 * correspondiente (mismo patron que ya usa cada modal para el error manual
 * de "cuit").
 */
export const useValidarDomicilioRequerido = ({
  getValues,
  setError,
  clearErrors,
  errors,
  currentCalle,
  currentProvincia,
  currentCiudadId,
}) => {
  useEffect(() => {
    if (errors.calle?.type === "manual") clearErrors("calle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCalle, clearErrors]);

  useEffect(() => {
    if (errors.provinciaid?.type === "manual") clearErrors("provinciaid");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProvincia, clearErrors]);

  useEffect(() => {
    if (errors.ciudadid?.type === "manual") clearErrors("ciudadid");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCiudadId, clearErrors]);

  const validar = () => {
    let esValido = true;

    if (!String(getValues("calle") || "").trim()) {
      setError("calle", { type: "manual", message: "La calle es requerida." });
      esValido = false;
    }
    if (!getValues("provinciaid")) {
      setError("provinciaid", {
        type: "manual",
        message: "La provincia es requerida.",
      });
      esValido = false;
    }
    if (!getValues("ciudadid")) {
      setError("ciudadid", {
        type: "manual",
        message: "La ciudad es requerida.",
      });
      esValido = false;
    }

    return esValido;
  };

  return validar;
};
