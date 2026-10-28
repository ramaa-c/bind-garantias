import { ESTADO_APROBADA, esEstadoEnCurso } from "./estadoLimiteSocio";

export const ORIGEN_CADENA_LINEA = "linea";
export const ORIGEN_CADENA_ALTA = "alta";
export const ORIGEN_CADENA_MANUAL = "manual";

const comoLista = (data) => (Array.isArray(data) ? data : data ? [data] : []);

const idValido = (valor) => {
  const id = Number(valor);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const esLineaVigente = (linea) =>
  esEstadoEnCurso(linea.tipolimiteestadoid) || Number(linea.tipolimiteestadoid) === ESTADO_APROBADA;

export const cadenasPorLineas = (lineas) => {
  const ordenadas = comoLista(lineas)
    .map((linea) => ({
      cadenaValorId: idValido(linea.cadenavalorid),
      vigente: esLineaVigente(linea),
      orden: Number(linea.tipolimitesocioid) || 0,
    }))
    .filter((linea) => linea.cadenaValorId)
    .sort((a, b) => Number(b.vigente) - Number(a.vigente) || b.orden - a.orden);
  return [...new Set(ordenadas.map((linea) => linea.cadenaValorId))];
};

export const cadenaDeAlta = (historialCda, pantallaGrupoCdaIdIngreso) => {
  const filas = comoLista(historialCda)
    .filter((fila) => idValido(fila.cadenavalorid))
    .filter(
      (fila) =>
        pantallaGrupoCdaIdIngreso == null ||
        Number(fila.pantallagrupocdaid) === Number(pantallaGrupoCdaIdIngreso),
    )
    .sort((a, b) => Number(a.socioexecutecdaid) - Number(b.socioexecutecdaid));
  return filas.length > 0 ? idValido(filas[0].cadenavalorid) : null;
};

export const resolverCadenasDelSocio = ({ lineas, historialCda, pantallaGrupoCdaIdIngreso }) => {
  const porLineas = cadenasPorLineas(lineas);
  if (porLineas.length > 0) {
    return porLineas.map((cadenaValorId) => ({ cadenaValorId, origen: ORIGEN_CADENA_LINEA }));
  }
  const deAlta = cadenaDeAlta(historialCda, pantallaGrupoCdaIdIngreso);
  return deAlta ? [{ cadenaValorId: deAlta, origen: ORIGEN_CADENA_ALTA }] : [];
};
