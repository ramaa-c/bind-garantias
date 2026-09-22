// El SQL compara el CUIT contra un VARCHAR(11), así que va sin guiones ni
// espacios (y "—", el placeholder que usa la UI cuando no encontró al
// socio, queda en "" y cae como faltante).
const soloDigitos = (valor) => {
  if (valor === undefined || valor === null) return undefined;
  return String(valor).replace(/\D/g, "");
};

// Mapa entre el nombre de "Campo" que devuelve el catálogo
// (catalogos/ModeloDocumento/{ModeloID}/Parametros) y el dato que la
// plataforma efectivamente tiene disponible para resolverlo.
//
// El catálogo NO dice qué significa cada campo: el único lugar donde eso
// está escrito es el SQLParametros del propio modelo, que el frontend no
// puede interpretar. Por eso el mapeo es explícito acá, campo por campo,
// derivado de haber leído el SQL de los 26 modelos que hay hoy en el
// catálogo. Equivalencia de cada uno según su SQL:
//
//   numTramite  -> TipoLimiteSocio.TipoLimiteSocioID = @numTramite
//   txtCuit     -> Socio.Cuit = @Cuit  (VARCHAR(11), sin guiones)
//   numImporte  -> DECLARE @Importe MONEY = :numImporte
//   parMoneda   -> inner join Moneda on Moneda.MonedaId = :parMoneda
//   parCV       -> DECLARE @cadenaValor INT = :parCV
const RESOLVERS_POR_CAMPO = {
  numTramite: (contexto) => contexto.tipoLimiteSocioId,
  txtCuit: (contexto) => soloDigitos(contexto.cuit),
  numImporte: (contexto) => contexto.importe,
  parMoneda: (contexto) => contexto.monedaId,
  parCV: (contexto) => contexto.cadenaValorId,
};

// Campos que existen en los modelos del catálogo pero que NO salen de una
// solicitud: o pertenecen a otro dominio (Fondo de Riesgo), o a una etapa
// posterior (el certificado recién existe cuando el préstamo está avalado
// en SGR+), o son configuración de firma.
//
// Están acá para poder explicarle al admin por qué ese modelo no se puede
// generar, en vez de tirarle un "falta un dato" genérico que parece un bug.
const CAMPOS_FUERA_DE_ALCANCE = {
  parApoderadoA: "los apoderados que firman por la SGR",
  parApoderadoB: "los apoderados que firman por la SGR",
  numCertificado:
    "el número de certificado de garantía, que recién existe cuando el préstamo está avalado en SGR+",
  AporteID: "un aporte al Fondo de Riesgo",
  numaporte: "un importe de aporte al Fondo de Riesgo",
  fchFecha: "una fecha de retiro/reintegro del Fondo de Riesgo",
  fchDesde: "un rango de fechas (es un reporte masivo, no el documento de una solicitud)",
  fchHasta: "un rango de fechas (es un reporte masivo, no el documento de una solicitud)",
};

// contexto: datos disponibles de la solicitud desde donde se pide el
// documento — { tipoLimiteSocioId, cuit, importe, monedaId, cadenaValorId }.
//
// Devuelve { parametros, faltantes }: parametros ya listo para mandar en el
// POST /api/ModeloDocumentoPDF, y faltantes con los campos que no se
// pudieron resolver (cada uno con su motivo, si se conoce) para mostrarlos
// en la UI en vez de mandar un payload incompleto.
export const resolverParametros = (parametrosDelCatalogo, contexto = {}) => {
  const parametros = [];
  const faltantes = [];

  (parametrosDelCatalogo || []).forEach((parametro) => {
    const campo = parametro.campo ?? parametro.Campo;
    const tipo = parametro.tipo ?? parametro.Tipo;
    const resolver = RESOLVERS_POR_CAMPO[campo];
    const valor = resolver ? resolver(contexto) : undefined;

    if (valor === undefined || valor === null || valor === "") {
      faltantes.push({ campo, motivo: CAMPOS_FUERA_DE_ALCANCE[campo] || null });
      return;
    }

    parametros.push({ campo, tipo, valor });
  });

  return { parametros, faltantes };
};

// Arma el mensaje que ve el admin cuando un modelo no se puede generar.
// Si todos los faltantes son campos conocidos fuera de alcance, se explica
// el motivo; si hay alguno desconocido, se lo nombra para poder sumarlo a
// RESOLVERS_POR_CAMPO.
const describirFaltantes = (faltantes) => {
  const desconocidos = faltantes.filter((f) => !f.motivo);

  if (desconocidos.length > 0) {
    return `Este modelo pide un dato que la plataforma todavía no sabe completar: ${desconocidos
      .map((f) => f.campo)
      .join(", ")}.`;
  }

  const motivos = [...new Set(faltantes.map((f) => f.motivo))];
  return `Este modelo no se puede generar desde una solicitud porque necesita ${motivos.join(" y ")}.`;
};

// Datos de la solicitud (el item que arma el Dashboard) de los que sale
// cada parámetro. Centralizado acá para que el botón y la generación usen
// exactamente el mismo criterio.
const construirContextoSolicitud = (solicitud) => ({
  tipoLimiteSocioId: solicitud?.id,
  cuit: solicitud?.cuit,
  importe: solicitud?.raw?.importelimite ?? solicitud?.raw?.ImporteLimite,
  monedaId: solicitud?.raw?.monedaid ?? solicitud?.raw?.MonedaId ?? solicitud?.raw?.MonedaID,
  cadenaValorId: solicitud?.cadenavalorid,
});

// ⚠️ TEMPORAL (2026-09-22) - Tipos de modelo que hoy no tienen NINGÚN modelo
// generable desde una solicitud, ocultados del combo de la cadena para que
// el admin no los elija y se encuentre con un combo de modelos vacío.
//
// Está hardcodeado porque averiguarlo en runtime exige traer
// catalogos/ModeloDocumento SIN filtro (~17MB) para después pedir los
// parámetros de los 26 modelos. El filtro que SÍ es dinámico es el de
// modelos dentro de un tipo (ver esModeloResolubleDesdeSolicitud), que es
// el que cubre los tipos "parciales".
//
// Relevado el 2026-09-22 contra el catálogo completo:
//   500 Certificado de FDR                 -> modelos -4/-1/-2: Fondo de Riesgo
//   203 Certificado de Garantía CREDICUOTAS -> modelo 12: apoderados SGR + NroCertificadoGarantia
//   204 Certificado masivo Mercadolibre     -> modelo 14: reporte masivo por rango de fechas
//     3 Solicitud Garantia Prestamo/ON      -> modelos 4/3: apoderados SGR + NroCertificadoGarantia
//   202 Contrato MELI                       -> sin modelos cargados
//     2 Solicitud Garantía Cheque/Pagaré    -> sin modelos cargados
//
// Hay que revisar esta lista si el backend carga modelos nuevos, o cuando se
// resuelva de dónde salen los apoderados que firman por la SGR (eso solo
// habilitaría 11 modelos de una).
const TIPOS_MODELO_DOCUMENTO_SIN_SOPORTE = new Set([500, 203, 204, 3, 202, 2]);

// Saca del combo los tipos sin ningún modelo utilizable.
//
// tipoSeleccionado se respeta siempre, aunque esté en la lista: si una
// cadena ya quedó configurada con un modelo de esos, ocultarle el tipo
// dejaría el combo mostrando un valor que no existe entre sus opciones.
export const filtrarTiposModeloDocumento = (opciones, tipoSeleccionado) =>
  (opciones || []).filter(
    (opcion) =>
      String(opcion.value) === String(tipoSeleccionado) ||
      !TIPOS_MODELO_DOCUMENTO_SIN_SOPORTE.has(Number(opcion.value)),
  );

// ¿Los campos que pide este modelo son TODOS de los que la plataforma sabe
// completar desde una solicitud?
//
// A diferencia de evaluarModeloDocumento, no mira valores concretos: sirve
// para filtrar el combo de modelos en la configuración de la cadena, donde
// todavía no hay ninguna solicitud contra la cual resolver.
//
// Devuelve null cuando los parámetros todavía no cargaron (el combo tiene
// que esperar en vez de mostrar una lista a medias).
export const esModeloResolubleDesdeSolicitud = (parametrosCatalogo) => {
  if (!Array.isArray(parametrosCatalogo)) return null;
  return parametrosCatalogo.every((p) => !!RESOLVERS_POR_CAMPO[p.campo ?? p.Campo]);
};

// ¿Se puede generar el documento de esta solicitud con este modelo?
//
// Se usa en dos momentos: en el render de cada fila (para que el botón
// explique el problema en su tooltip antes de clickear) y al generar (para
// no abrir una pestaña nueva que después haya que cerrar).
//
// parametrosCatalogo en null/undefined significa "todavía no cargaron":
// ahí se asume disponible y la validación real queda para el momento de
// generar, que es cuando se van a pedir sí o sí.
export const evaluarModeloDocumento = ({ solicitud, modeloDocumentoId, parametrosCatalogo }) => {
  if (!modeloDocumentoId || Number(modeloDocumentoId) <= 0) {
    return {
      disponible: false,
      motivo: `La cadena de ${solicitud?.cliente || "esta solicitud"} todavía no tiene un modelo de documento configurado.`,
      parametros: null,
    };
  }

  if (!parametrosCatalogo) {
    return { disponible: true, motivo: null, parametros: null };
  }

  const { parametros, faltantes } = resolverParametros(
    parametrosCatalogo,
    construirContextoSolicitud(solicitud),
  );

  if (faltantes.length > 0) {
    return { disponible: false, motivo: describirFaltantes(faltantes), parametros: null };
  }

  return { disponible: true, motivo: null, parametros };
};
