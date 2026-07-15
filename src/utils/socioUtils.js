// Un Socio "stub" es un registro que solo tiene el Cuit cargado — lo crea el
// backend al ejecutar cda/execute (para tener dónde loguear el historial de
// CDA) o nuestro propio flujo de resumen en Paso1Cuit. No representa una
// empresa realmente registrada, aunque ya tenga un usuario vinculado.
export const esSocioVacio = (socio) => {
  if (!socio) return true;
  const denominacion = String(
    socio.denominacion ?? socio.Denominacion ?? "",
  ).trim();
  const tipopersonaid = Number(socio.tipopersonaid ?? socio.TipoPersonaID ?? 0);
  const socioestadoid = Number(
    socio.socioestadoid ?? socio.SocioEstadoId ?? socio.SocioEstadoID ?? 0,
  );
  return !denominacion && !tipopersonaid && !socioestadoid;
};
