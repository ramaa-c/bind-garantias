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
 *      nunca un id ya resuelto. Acá sí se valida (shouldValidate) porque
 *      un match limpia cualquier error previo sobre un valor que ahora es
 *      valido.
 *   3. Si tampoco matchea, limpia id y texto SIN forzar validacion - esto
 *      corre en el background (ej. apenas cambia la provincia, o al abrir
 *      el modal), no en respuesta a un intento de guardar del usuario, asi
 *      que no corresponde mostrarle todavia "la ciudad es requerida". Esa
 *      validacion queda para el submit (trigger()/handleGuardar propio de
 *      cada formulario).
 *
 * `opciones` vacio NO es lo mismo que "cargado y confirmado sin match": el
 * catalogo que filtra a `opciones` (ej. useCiudades(provinciaId)) suele
 * estar deshabilitado hasta que se elige el campo padre (provincia), y una
 * query deshabilitada reporta cargando=false sin haber pedido nada todavia
 * - sin este chequeo, ese primer render (provincia aun sin resolver) borraba
 * un id/texto ya precargado (ej. desde el propio registro guardado) antes
 * de que el catalogo real llegara a cargar.
 */
export const useSincronizarCatalogoPorTexto = ({
  cargando,
  opciones,
  valorTexto,
  valorId,
  campoTexto,
  campoId,
  setValue,
}) => {
  useEffect(() => {
    if (cargando || opciones.length === 0) return;

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
      setValue(campoId, 0, { shouldDirty: true });
      setValue(campoTexto, "", { shouldDirty: true });
    }
  }, [cargando, opciones, valorTexto, valorId, campoTexto, campoId, setValue]);
};
