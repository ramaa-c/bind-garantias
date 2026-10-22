// Paleta fija por persona (barra de participación + cuadradito junto al % de
// cada tarjeta). Se asigna por el orden ORIGINAL de la lista, no por el orden
// visual: así el color de cada accionista no cambia cuando se reordena por
// estado y coincide siempre con su segmento en la barra.
export const PALETA_PARTICIPACION = [
  "#8A9FFF",
  "#B78CFF",
  "#4FD1C5",
  "#F59E8B",
  "#F5D76E",
  "#7DD3FC",
];

export const colorParticipacion = (indice) =>
  PALETA_PARTICIPACION[indice % PALETA_PARTICIPACION.length];

export const inicialesDe = (nombre) => {
  const palabras = String(nombre || "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (palabras.length === 0) return "?";
  return palabras
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
};

// Lo que necesita acción (datos faltantes o CDA en revisión) va primero.
// Copia el array (no muta props) y Array#sort es estable, así que dentro de
// cada grupo se respeta el orden en que vienen del backend.
export const ordenarPendientesPrimero = (entradas) =>
  [...entradas].sort(
    (a, b) =>
      Number(!(a.faltantes.length > 0 || a.cdaRechazado)) -
      Number(!(b.faltantes.length > 0 || b.cdaRechazado)),
  );

export const soloDigitos = (valor) => String(valor || "").replace(/\D/g, "");

// Personas ya cargadas en otras pestañas del legajo que se pueden reutilizar
// en el modal de alta ("O elegí a alguien que ya está en tu legajo"). Se
// excluye a quien ya tiene este rol (`itemsActuales`) y a `excluirCuit`:
// el accionista único no puede ser fiador de su propia empresa (SGRPLUSPLA-137)
// hasta que haya otro accionista.
export const sugerenciasPara = (personasLegajo, itemsActuales = [], excluirCuit) => {
  const yaTienenRol = new Set(itemsActuales.map((i) => soloDigitos(i.cuit)));
  const excluir = soloDigitos(excluirCuit);
  return (personasLegajo || []).filter(
    (p) => !yaTienenRol.has(p.cuit) && (!excluir || p.cuit !== excluir),
  );
};
