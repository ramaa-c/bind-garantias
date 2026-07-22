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

// FechaCierreEjercicio se guarda como el cierre del ciclo actual/próximo
// (confirmado en vivo: hoy 2026-07-22, varias empresas reales tienen
// "2026-12-31" — una fecha que todavía no pasó). Para decidir si un balance
// está al día hay que compararlo contra el ÚLTIMO cierre que ya ocurrió, no
// contra uno futuro: se toma el mes/día guardado y se lo ubica en el año
// actual; si ese día todavía no llegó, se retrocede un año.
const ultimoCierrePasado = (fechaCierreEjercicio, hoy) => {
  const cierre = soloFecha(fechaCierreEjercicio);
  if (!cierre) return null;

  const mes = cierre.getMonth();
  const dia = cierre.getDate();
  const candidato = new Date(hoy.getFullYear(), mes, dia);

  return candidato.getTime() > hoy.getTime()
    ? new Date(hoy.getFullYear() - 1, mes, dia)
    : candidato;
};

export const calcularEstadoBalance = ({
  fchArchivo,
  fechaCierreEjercicio,
  margenDias,
  hoy = new Date(),
}) => {
  const fechaBalance = soloFecha(fchArchivo);
  const hoySoloFecha = soloFecha(hoy) || hoy;
  const fechaCierre = ultimoCierrePasado(fechaCierreEjercicio, hoySoloFecha);

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

  if (hoySoloFecha.getTime() <= fechaLimite.getTime()) {
    const msPorDia = 1000 * 60 * 60 * 24;
    const diasRestantes = Math.ceil((fechaLimite.getTime() - hoySoloFecha.getTime()) / msPorDia);
    return { estado: "por_vencer", diasRestantes, fechaLimite };
  }

  return { estado: "vencido", fechaLimite };
};
