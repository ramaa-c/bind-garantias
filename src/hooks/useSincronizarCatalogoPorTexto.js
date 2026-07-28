import { useEffect } from "react";

const normalizarTexto = (str) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase();

// Busca en `opciones` (catalogo ya filtrado, ej. ciudades de una sola
// provincia) la entrada cuyo label matchea `texto` - exacto primero, y si
// no hay, por inclusion en cualquier direccion (nombres de AFIP/Nosis/LUFE
// a veces vienen truncados o con variantes menores).
const buscarPorTexto = (texto, opciones) => {
  const normTexto = normalizarTexto(texto);
  const exacto = opciones.find((o) => normalizarTexto(o.label) === normTexto);
  if (exacto) return exacto;
  return opciones.find(
    (o) =>
      normalizarTexto(o.label).includes(normTexto) ||
      normTexto.includes(normalizarTexto(o.label)),
  );
};

/**
 * Mantiene sincronizado un par texto/id de un formulario (ej. ciudad/ciudadid,
 * localidad/localidadid) contra un catalogo que se filtra por otro campo
 * (ej. la provincia elegida). Pensado para selects tipo "Ciudad" cuyas
 * opciones cambian segun otro select ya elegido.
 *
 * En cada corrida, una vez que `opciones` termino de cargar:
 *   1. Si `valorId` sigue apareciendo en `opciones`, no hace nada.
 *   2. Si no (o no habia id todavia), intenta resolverlo matcheando
 *      `valorTexto` contra `opciones` - cubre el caso de integraciones
 *      externas (AFIP/Nosis/LUFE) que solo devuelven el nombre en texto y
 *      nunca un id ya resuelto.
 *   3. Si tampoco matchea, limpia id y texto para forzar que el usuario
 *      elija de nuevo - pasa, por ejemplo, cuando cambia el campo por el
 *      que se filtra (la provincia) y la seleccion vieja ya no pertenece a
 *      la lista nueva.
 */
export const useSincronizarCatalogoPorTexto = ({
  cargando,
  opciones,
  valorTexto,
  valorId,
  campoTexto,
  campoId,
  setValue,
  // El campo texto suele ser solo informativo (la validacion real vive en
  // el id), pero algunos schemas exigen el texto en si (ej. `localidad` en
  // AltaDatosEmpresaSchema) - en esos casos pasar true para que el error
  // aparezca apenas se limpia, no recien en el proximo submit.
  validarTextoAlLimpiar = false,
}) => {
  useEffect(() => {
    if (cargando) return;

    if (valorId) {
      const sigueValido = opciones.some(
        (o) => String(o.value) === String(valorId),
      );
      if (sigueValido) return;
    }

    const match = valorTexto && buscarPorTexto(valorTexto, opciones);
    if (match) {
      setValue(campoId, Number(match.value), {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue(campoTexto, match.label, {
        shouldValidate: true,
        shouldDirty: true,
      });
      return;
    }

    if (valorId) {
      setValue(campoId, 0, { shouldValidate: true, shouldDirty: true });
      setValue(campoTexto, "", {
        shouldValidate: validarTextoAlLimpiar,
        shouldDirty: true,
      });
    }
  }, [
    cargando,
    opciones,
    valorTexto,
    valorId,
    campoTexto,
    campoId,
    setValue,
    validarTextoAlLimpiar,
  ]);
};
