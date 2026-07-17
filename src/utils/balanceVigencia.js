// Regla: un balance cubre el período hasta fchArchivo. Si ese período es
// anterior al último cierre de ejercicio del socio (FechaCierreEjercicio),
// el balance quedó desactualizado, pero sigue contando como válido durante
// un margen de días de prórroga (configurable, ver useDiasMargenVencimientoBalance)
// contado desde la fecha de cierre. Pasado ese margen, se lo trata como si
// no existiera.
const soloFecha = (valor) => {
  if (!valor) return null;
  const fecha = new Date(String(valor).split("T")[0]);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

export const calcularEstadoBalance = ({
  fchArchivo,
  fechaCierreEjercicio,
  margenDias,
  hoy = new Date(),
}) => {
  const fechaBalance = soloFecha(fchArchivo);
  const fechaCierre = soloFecha(fechaCierreEjercicio);

  if (!fechaBalance) return { estado: "faltante" };
  // Sin fecha de cierre del socio o sin margen resuelto todavía: no hay con
  // qué validar — nunca bloqueamos por falta de un dato nuestro.
  if (!fechaCierre || margenDias === null || margenDias === undefined) {
    return { estado: "sin_datos" };
  }

  if (fechaBalance.getTime() >= fechaCierre.getTime()) {
    return { estado: "vigente" };
  }

  const fechaLimite = new Date(fechaCierre);
  fechaLimite.setDate(fechaLimite.getDate() + Number(margenDias));

  const hoySoloFecha = soloFecha(hoy) || hoy;

  if (hoySoloFecha.getTime() <= fechaLimite.getTime()) {
    const msPorDia = 1000 * 60 * 60 * 24;
    const diasRestantes = Math.ceil((fechaLimite.getTime() - hoySoloFecha.getTime()) / msPorDia);
    return { estado: "por_vencer", diasRestantes, fechaLimite };
  }

  return { estado: "vencido", fechaLimite };
};
