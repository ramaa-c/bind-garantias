import { useMemo, useState } from "react";
import {
  FiActivity,
  FiInbox,
  FiEye,
  FiPlusCircle,
  FiEdit2,
  FiTrash2,
  FiUser,
  FiChevronDown,
  FiChevronRight,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { Modal, SelectSimple, SelectFechaSimple, Button } from "../../../ui";
import { Skeleton } from "../../../ui/Skeleton/Skeleton";
import { useActividadSocio } from "../../../../hooks/useSocios";
import { useObtenerUsuarioPorId } from "../../../../hooks/useUsuario";
import styles from "./ActividadSocioModal.module.css";

const ELEMENTOS_POR_TANDA = 12;

const OPCIONES_ORDEN = [
  { value: "desc", label: "Más recientes" },
  { value: "asc", label: "Más antiguas" },
];

// SelectFechaSimple entrega el valor ya como ISO completo (mismo criterio
// que Dashboard.jsx/Solicitudes.jsx) — el límite superior del rango se lleva
// a las 23:59:59 locales en vez de asumir un formato "yyyy-mm-dd".
const finDelDia = (fecha) => {
  const d = new Date(fecha);
  d.setHours(23, 59, 59, 999);
  return d;
};

const diaLocal = (fecha) => {
  if (!fecha) return undefined;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return undefined;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Orden en el que se muestran los chips de verbo cuando están presentes.
const ORDEN_VERBOS = ["get", "post", "put", "patch", "delete"];

const VERBOS = {
  get: { label: "Consulta", tono: "get", Icon: FiEye },
  post: { label: "Alta", tono: "post", Icon: FiPlusCircle },
  put: { label: "Modificación", tono: "put", Icon: FiEdit2 },
  patch: { label: "Modificación", tono: "put", Icon: FiEdit2 },
  delete: { label: "Baja", tono: "delete", Icon: FiTrash2 },
};

// El backend nombra cada operación como "GetColeccionSocio",
// "putTerceroRelacionado", etc. (verbo HTTP + entidad, casing inconsistente
// entre GET y put/post) — no es la ruta real del endpoint, así que no
// alcanza con mostrar el string tal cual: se separa el verbo (define
// color/ícono/filtro) de la entidad (define el texto legible).
const ENTIDAD_LABELS = {
  coleccionsocio: "Listado de empresas",
  socio: "Datos de la empresa",
  socioexecutecda: "Evaluación de criterios (empresa)",
  tercerorelacionado: "Datos de accionista/representante",
  terceroexecutecda: "Evaluación de criterios (accionista/representante)",
  afipempresaporcuit: "Consulta a ARCA",
  socioarchivo: "Documento del legajo",
  sociousuario: "Usuario vinculado",
  certificadovigente: "Certificado PyME",
  validarcuit: "Validación de CUIT",
  migrar: "Migración a SGR+",
};

const humanizarEntidad = (raw) => {
  const sinColeccion = raw.replace(/^Coleccion/, "");
  const conEspacios = sinColeccion.replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim();
  return conEspacios || raw;
};

const parseActividad = (descripcion) => {
  const texto = String(descripcion || "").trim();
  const match = /^(get|post|put|patch|delete)(.*)$/i.exec(texto);
  if (!match || !match[2]) {
    return { verbo: "get", label: texto || "Actividad" };
  }
  const verbo = match[1].toLowerCase();
  const entidadRaw = match[2];
  const label = ENTIDAD_LABELS[entidadRaw.toLowerCase()] || humanizarEntidad(entidadRaw);
  return { verbo, label };
};

const formatearAbsoluto = (iso) => {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" });
};

const parseDetalle = (detalle) => {
  if (!detalle || typeof detalle !== "string") return null;
  try {
    return JSON.parse(detalle);
  } catch {
    return null;
  }
};

const formatearHora = (iso) => {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
};

const claveDia = (iso) => {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toDateString();
};

const etiquetaDia = (iso) => {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "Sin fecha";
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);
  const corta = fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
  if (fecha.toDateString() === hoy.toDateString()) return "Hoy";
  if (fecha.toDateString() === ayer.toDateString()) return `Ayer · ${corta}`;
  const dia = fecha.toLocaleDateString("es-AR", { weekday: "long" });
  const anio = fecha.getFullYear() !== hoy.getFullYear() ? `/${fecha.getFullYear()}` : "";
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} · ${corta}${anio}`;
};

const tonoDe = (item) => (VERBOS[parseActividad(item.descripcion).verbo] || VERBOS.get).tono;

const ActividadItem = ({ item }) => {
  const [expandido, setExpandido] = useState(false);
  const { verbo, label } = useMemo(() => parseActividad(item.descripcion), [item.descripcion]);
  const meta = VERBOS[verbo] || VERBOS.get;
  const detalle = useMemo(() => parseDetalle(item.detalleactividad), [item.detalleactividad]);
  const usuarioWebId = item.usuariowebid;

  const { data: usuarioData, isLoading: cargandoUsuario } = useObtenerUsuarioPorId(usuarioWebId);
  const emailUsuario = usuarioData?.email;

  return (
    <li className={styles.item}>
      <span className={`${styles.itemPunto} ${styles[`tono-${meta.tono}`]}`} aria-hidden="true" />
      <button
        type="button"
        className={styles.itemMain}
        onClick={() => setExpandido((v) => !v)}
        aria-expanded={expandido}
      >
        <span className={styles.itemHora} title={formatearAbsoluto(item.momento)}>
          {formatearHora(item.momento)}
        </span>
        <span className={styles.itemTipo}>
          <span className={`${styles.verboPill} ${styles[`tono-${meta.tono}`]}`}>
            <meta.Icon size={11} aria-hidden="true" />
            {meta.label}
          </span>
        </span>
        <span className={styles.itemLabel}>{label}</span>
        {!!usuarioWebId && (
          <span className={styles.itemUsuario} title={emailUsuario || ""}>
            <FiUser size={11} aria-hidden="true" />
            {emailUsuario || (cargandoUsuario ? "Cargando usuario…" : `Usuario #${usuarioWebId}`)}
          </span>
        )}
        {expandido ? (
          <FiChevronDown className={styles.itemChevron} size={14} />
        ) : (
          <FiChevronRight className={styles.itemChevron} size={14} />
        )}
      </button>
      {expandido && (
        <div className={styles.itemDetalle}>
          {detalle ? (
            <pre className={styles.itemDetalleJson}>{JSON.stringify(detalle, null, 2)}</pre>
          ) : (
            <span className={styles.itemDetalleVacio}>Sin detalle adicional.</span>
          )}
        </div>
      )}
    </li>
  );
};

// Sin fechaDesde la API devuelve solo el último mes: se muestra ese rango en
// el filtro en vez de dejarlo vacío, que daba a entender "todo el historial".
// Mismo formato que entrega SelectFechaSimple (mediodía local).
const haceUnMes = () => {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate(), 12, 0, 0).toISOString();
};

const FILTROS_DEFECTO = {
  verbo: "todas",
  busqueda: "",
  fechaHasta: "",
  orden: "desc",
};

export const ActividadSocioModal = ({ isOpen, onClose, cuit, denominacion }) => {
  const [verbo, setVerbo] = useState(FILTROS_DEFECTO.verbo);
  const [busqueda, setBusqueda] = useState(FILTROS_DEFECTO.busqueda);
  const [fechaDesde, setFechaDesde] = useState(haceUnMes);
  const [fechaHasta, setFechaHasta] = useState(FILTROS_DEFECTO.fechaHasta);
  const [orden, setOrden] = useState(FILTROS_DEFECTO.orden);
  const [visibles, setVisibles] = useState(ELEMENTOS_POR_TANDA);

  const { data, isLoading, isError, hayMasRegistros, cargandoMas, falloCargarMas, cargarMas } =
    useActividadSocio(cuit, isOpen, {
      descendente: orden === "desc",
      fechaDesde: diaLocal(fechaDesde),
      fechaHasta: diaLocal(fechaHasta),
    });

  const actividad = useMemo(() => {
    return [...data].sort((a, b) =>
      orden === "desc"
        ? new Date(b.momento) - new Date(a.momento)
        : new Date(a.momento) - new Date(b.momento),
    );
  }, [data, orden]);

  // Tipos de operación realmente presentes en el log de esta empresa (no
  // tiene sentido ofrecer "DELETE" en el desplegable si nunca hubo una baja)
  // — se calcula sobre el total sin filtrar para que las opciones no
  // aparezcan/desaparezcan al jugar con los otros filtros.
  const chipsTipo = useMemo(() => {
    const conteos = {};
    actividad.forEach((item) => {
      const tono = tonoDe(item);
      conteos[tono] = (conteos[tono] || 0) + 1;
    });
    const tipos = [
      { value: "get", label: "Consulta" },
      { value: "post", label: "Alta" },
      { value: "put", label: "Modificación" },
      { value: "delete", label: "Baja" },
    ]
      .filter((t) => conteos[t.value] > 0)
      .map((t) => ({ ...t, cantidad: conteos[t.value] }));
    return [{ value: "todas", label: "Todo", cantidad: actividad.length }, ...tipos];
  }, [actividad]);

  const fechaDesdeDate = fechaDesde ? new Date(fechaDesde) : undefined;
  const fechaHastaDate = fechaHasta ? new Date(fechaHasta) : undefined;

  const actividadFiltrada = useMemo(() => {
    let lista = actividad;

    if (verbo !== "todas") {
      lista = lista.filter((item) => tonoDe(item) === verbo);
    }

    if (fechaDesde) {
      const desde = new Date(fechaDesde);
      lista = lista.filter((item) => new Date(item.momento) >= desde);
    }

    if (fechaHasta) {
      const hasta = finDelDia(fechaHasta);
      lista = lista.filter((item) => new Date(item.momento) <= hasta);
    }

    const busquedaLimpia = busqueda.trim().toLowerCase();
    if (busquedaLimpia) {
      lista = lista.filter((item) => {
        const { label } = parseActividad(item.descripcion);
        return (
          label.toLowerCase().includes(busquedaLimpia) ||
          String(item.descripcion || "").toLowerCase().includes(busquedaLimpia)
        );
      });
    }

    return lista;
  }, [actividad, verbo, fechaDesde, fechaHasta, busqueda]);

  const hayFiltrosActivos =
    verbo !== FILTROS_DEFECTO.verbo ||
    !!busqueda ||
    diaLocal(fechaDesde) !== diaLocal(haceUnMes()) ||
    !!fechaHasta ||
    orden !== FILTROS_DEFECTO.orden;

  const resetVisibles = () => setVisibles(ELEMENTOS_POR_TANDA);

  const handleVerbo = (key) => {
    setVerbo(key);
    resetVisibles();
  };

  const handleBusqueda = (value) => {
    setBusqueda(value);
    resetVisibles();
  };

  const handleFechaDesde = (value) => {
    setFechaDesde(value || haceUnMes());
    resetVisibles();
  };

  const handleFechaHasta = (value) => {
    setFechaHasta(value);
    resetVisibles();
  };

  const handleOrden = (value) => {
    setOrden(value);
    resetVisibles();
  };

  const limpiarFiltros = () => {
    setVerbo(FILTROS_DEFECTO.verbo);
    setBusqueda(FILTROS_DEFECTO.busqueda);
    setFechaDesde(haceUnMes());
    setFechaHasta(FILTROS_DEFECTO.fechaHasta);
    setOrden(FILTROS_DEFECTO.orden);
    resetVisibles();
  };

  const handleClose = () => {
    limpiarFiltros();
    onClose();
  };

  const handleCargarMas = () => {
    if (visibles >= actividadFiltrada.length) cargarMas();
    setVisibles((v) => v + ELEMENTOS_POR_TANDA);
  };

  const visiblesLista = actividadFiltrada.slice(0, visibles);
  const hayFiltroDeFecha = !!fechaDesde || !!fechaHasta;
  const dias = [];
  visiblesLista.forEach((item) => {
    const clave = claveDia(item.momento);
    const ultimo = dias[dias.length - 1];
    if (ultimo && ultimo.clave === clave) ultimo.items.push(item);
    else dias.push({ clave, etiqueta: etiquetaDia(item.momento), items: [item] });
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Actividad de la empresa"
      subtitle={denominacion ? `${denominacion} · CUIT ${cuit}` : `CUIT ${cuit}`}
      icono={<FiActivity />}
      maxWidth="820px"
      variant="blue"
      footer={
        <>
          {!isLoading && actividad.length > 0 && (
            <span className={styles.contador}>
              Mostrando {visiblesLista.length} de {actividadFiltrada.length}
              {actividadFiltrada.length !== actividad.length ? ` (${actividad.length} en total)` : ""}
              {hayMasRegistros ? " · Hay registros más recientes sin cargar" : ""}
              {falloCargarMas ? " · No se pudieron traer más registros" : ""}
            </span>
          )}
          {visibles < actividadFiltrada.length || hayMasRegistros ? (
            <Button variant="adminSuave" onClick={handleCargarMas} isLoading={cargandoMas} disabled={cargandoMas}>
              Cargar más
            </Button>
          ) : (
            <Button variant="adminNeutro" onClick={handleClose}>
              Cerrar
            </Button>
          )}
        </>
      }
    >
      <div className={styles.filterBar}>
        <div className={styles.filterControlsRow}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar en el log"
              value={busqueda}
              onChange={(e) => handleBusqueda(e.target.value)}
              className={styles.searchInput}
              aria-label="Buscar en el log"
            />
          </div>
          <div className={styles.filterFieldsRow}>
            <SelectFechaSimple
              label="Desde"
              value={fechaDesde}
              onChange={handleFechaDesde}
              disableFuture
              maxDate={fechaHastaDate}
              variant="admin"
              compact
              hideErrorSpace
              className={styles.filterField}
            />
            <SelectFechaSimple
              label="Hasta"
              value={fechaHasta}
              onChange={handleFechaHasta}
              disableFuture
              minDate={fechaDesdeDate}
              variant="admin"
              compact
              hideErrorSpace
              className={styles.filterField}
            />
            <SelectSimple
              label="Orden"
              value={orden}
              onChange={handleOrden}
              options={OPCIONES_ORDEN}
              isSearchable={false}
              hideErrorSpace
              compact
              variant="admin"
              className={styles.filterField}
            />
          </div>
        </div>

        {!isLoading && actividad.length > 0 && (
          <div className={styles.chips} role="group" aria-label="Filtrar por tipo">
            {chipsTipo.map((chip) => {
              const meta = Object.values(VERBOS).find((v) => v.tono === chip.value);
              return (
                <button
                  key={chip.value}
                  type="button"
                  className={`${styles.chip} ${verbo === chip.value ? styles.chipActivo : ""}`}
                  aria-pressed={verbo === chip.value}
                  onClick={() => handleVerbo(chip.value)}
                >
                  {meta && <meta.Icon size={11} aria-hidden="true" />}
                  {chip.label} <span className={styles.chipCantidad}>{chip.cantidad}</span>
                </button>
              );
            })}
            {hayFiltrosActivos && (
              <button type="button" className={styles.clearFiltersBtn} onClick={limpiarFiltros}>
                <FiX aria-hidden="true" />
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className={styles.skeletonList}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeletonRow}>
              <Skeleton width="2.5rem" height="0.7rem" />
              <Skeleton width="5.5rem" height="1.1rem" radius="pill" />
              <Skeleton width="40%" height="0.8rem" />
            </div>
          ))}
        </div>
      ) : isError || actividad.length === 0 ? (
        <div className={styles.emptyState}>
          <FiInbox className={styles.emptyStateIcon} />
          <span>
            {isError
              ? "No se pudo obtener el log de actividad."
              : "Sin actividad registrada para esta empresa."}
          </span>
        </div>
      ) : actividadFiltrada.length === 0 ? (
        <div className={styles.emptyState}>
          <FiInbox className={styles.emptyStateIcon} />
          <span>
            No hay actividad que coincida con los filtros aplicados
            {hayMasRegistros ? " entre los registros cargados" : ""}.
            {hayMasRegistros && hayFiltroDeFecha ? " Cargá más para buscar en fechas más recientes." : ""}
          </span>
          <button type="button" className={styles.limpiarFiltrosInline} onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className={styles.dias}>
          {dias.map((dia) => (
            <section key={dia.clave} className={styles.dia}>
              <h4 className={styles.diaTitulo}>
                <span>{dia.etiqueta}</span>
                <span className={styles.diaLinea} aria-hidden="true" />
              </h4>
              <ul className={styles.lista}>
                {dia.items.map((item) => (
                  <ActividadItem key={item.logactividadid} item={item} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Modal>
  );
};
