// Metadata de las integraciones que se pueden apagar/prender desde el panel
// de Modo Offline. `campo` coincide exactamente con la clave PascalCase que
// espera el backend en el POST de api/StatusPlataforma.
export const INTEGRACIONES = [
  {
    campo: "IntegracionNosis",
    nombre: "Nosis",
    descripcion: "Consulta de datos por CUIT y variables (CDA_SCO, etc.)",
  },
  {
    campo: "IntegracionArca",
    nombre: "ARCA / AFIP",
    descripcion: "Constancia de inscripción y datos fiscales",
  },
  {
    campo: "IntegracionLufe",
    nombre: "LUFE",
    descripcion: "Consulta de entidades",
  },
  {
    campo: "IntegracionCasfog",
    nombre: "CASFOG",
    descripcion: "Motor de criterios de aceptación (CASFOG)",
  },
  {
    campo: "IntegracionSGRPlus",
    nombre: "SGR+",
    descripcion: "Sistema core legacy (migración de legajos aprobados)",
  },
];

export const STATUS_POR_DEFECTO = {
  statusgeneral: "1",
  integracionsgrplus: "1",
  integracioncasfog: "1",
  integracionlufe: "1",
  integracionarca: "1",
  integracionnosis: "1",
};

const idDe = (item) => Number(item?.statusplataformaid ?? item?.StatusPlataformaID) || 0;

// El GET devuelve el historial completo (un registro por cada cambio); el
// vigente es el de mayor StatusPlataformaID.
export const obtenerUltimoStatus = (data) => {
  const lista = Array.isArray(data) ? data : data ? [data] : [];
  if (lista.length === 0) return null;
  return [...lista].sort((a, b) => idDe(b) - idDe(a))[0];
};

export const ordenarHistorial = (data) => {
  const lista = Array.isArray(data) ? data : data ? [data] : [];
  return [...lista].sort((a, b) => idDe(b) - idDe(a));
};

// Campos que puede modificar el panel, en el orden en que se muestran las
// etiquetas cuando un registro cambia más de uno a la vez.
const camposMonitoreados = () => [
  {
    campo: "statusgeneral",
    etiqueta: (valor) => (String(valor) === "0" ? "Plataforma OFFLINE" : "Plataforma ONLINE"),
  },
  ...INTEGRACIONES.map(({ campo, nombre }) => ({
    campo: campo.toLowerCase(),
    etiqueta: (valor) => `${nombre} ${String(valor) === "0" ? "desactivada" : "activada"}`,
  })),
];

// Cada fila del historial es un registro completo (no un diff), así que para
// saber qué cambió puntualmente en cada uno hay que compararlo contra el
// registro inmediatamente anterior. Devuelve el historial ordenado del más
// reciente al más viejo, con un array `cambios` (strings) agregado a cada item.
export const construirHistorialConCambios = (data) => {
  const ascendente = [...ordenarHistorial(data)].reverse();
  const campos = camposMonitoreados();

  const conCambios = ascendente.map((item, index) => {
    const anterior = ascendente[index - 1];
    if (!anterior) {
      return { ...item, cambios: [campos[0].etiqueta(item.statusgeneral)] };
    }
    const cambios = campos
      .filter(({ campo }) => String(item[campo]) !== String(anterior[campo]))
      .map(({ campo, etiqueta }) => etiqueta(item[campo]));
    return { ...item, cambios: cambios.length > 0 ? cambios : [campos[0].etiqueta(item.statusgeneral)] };
  });

  return conCambios.reverse();
};

export const esOffline = (statusItem) => {
  const valor = statusItem?.statusgeneral ?? statusItem?.StatusGeneral;
  return String(valor) === "0";
};

export const integracionActiva = (statusItem, campo) => {
  const valor = statusItem?.[campo.toLowerCase()] ?? statusItem?.[campo];
  return String(valor ?? "1") !== "0";
};

// Arma el próximo registro a enviar por POST: el backend versiona cada
// cambio como una fila nueva (StatusPlataformaID en 0 para insertar), así
// que siempre partimos del último estado conocido y solo pisamos los campos
// que cambiaron.
export const crearPayloadStatus = (ultimoStatus, cambios, usuarioWebId) => ({
  ...STATUS_POR_DEFECTO,
  ...(ultimoStatus || {}),
  ...cambios,
  statusplataformaid: 0,
  usuariowebid: usuarioWebId,
  momento: generarMomentoActual(),
});

// Genera un timestamp ISO 8601 con el offset horario local (mismo formato
// que ya devuelve el backend, ej. "2026-07-13T11:02:21.910-03:00").
export const generarMomentoActual = () => {
  const ahora = new Date();
  const pad = (n, len = 2) => String(n).padStart(len, "0");
  const offsetMin = -ahora.getTimezoneOffset();
  const signo = offsetMin >= 0 ? "+" : "-";
  const offsetH = pad(Math.floor(Math.abs(offsetMin) / 60));
  const offsetM = pad(Math.abs(offsetMin) % 60);

  return (
    `${ahora.getFullYear()}-${pad(ahora.getMonth() + 1)}-${pad(ahora.getDate())}` +
    `T${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}` +
    `.${pad(ahora.getMilliseconds(), 3)}${signo}${offsetH}:${offsetM}`
  );
};

export const formatearMomento = (momento) => {
  if (!momento) return "-";
  const fecha = new Date(momento);
  if (Number.isNaN(fecha.getTime())) return "-";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "medium" }).format(fecha);
};
