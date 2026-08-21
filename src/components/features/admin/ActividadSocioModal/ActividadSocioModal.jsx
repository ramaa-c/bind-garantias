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
import { Modal, SelectSimple, SelectFechaSimple } from "../../../ui";
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
  afipempresaporcuit: "Consulta a AFIP",
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

const formatearRelativo = (iso) => {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "-";
  const diffMin = Math.round((Date.now() - fecha.getTime()) / 60000);
  if (diffMin < 1) return "Recién";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `Hace ${diffD} d`;
  return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
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

const ActividadItem = ({ item }) => {
  const [expandido, setExpandido] = useState(false);
  const { verbo, label } = useMemo(() => parseActividad(item.descripcion), [item.descripcion]);
  const meta = VERBOS[verbo] || VERBOS.get;
  const detalle = useMemo(() => parseDetalle(item.detalleactividad), [item.detalleactividad]);
  const usuarioWebId = item.usuariowebid;

  // Solo se pide el email cuando la fila efectivamente se renderiza (queda
  // dentro de la tanda visible) — react-query dedupea automáticamente las
  // filas que comparten el mismo UsuarioWebID (ej. el usuario "sistema" que
  // dispara la mayoría de las consultas de CDAs).
  const { data: usuarioData, isLoading: cargandoUsuario } = useObtenerUsuarioPorId(usuarioWebId);
  const emailUsuario = usuarioData?.email;

  return (
    <li className={styles.item}>
      <button
        type="button"
        className={styles.itemMain}
        onClick={() => setExpandido((v) => !v)}
        aria-expanded={expandido}
      >
        <span className={`${styles.verboIcon} ${styles[`tono-${meta.tono}`]}`}>
          <meta.Icon size={13} />
        </span>
        <span className={styles.itemInfo}>
          <span className={styles.itemLabel}>{label}</span>
          <span className={styles.itemMeta}>
            <span className={`${styles.verboPill} ${styles[`tono-${meta.tono}`]}`}>{meta.label}</span>
            {!!usuarioWebId && (
              <span className={styles.itemUsuario} title={emailUsuario || ""}>
                <FiUser size={10} />
                {emailUsuario || (cargandoUsuario ? "Cargando usuario…" : `Usuario #${usuarioWebId}`)}
              </span>
            )}
          </span>
        </span>
        <span className={styles.itemRight}>
          <span className={styles.itemFecha} title={formatearAbsoluto(item.momento)}>
            {formatearRelativo(item.momento)}
          </span>
          {expandido ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
        </span>
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

const FILTROS_DEFECTO = {
  verbo: "todas",
  busqueda: "",
  fechaDesde: "",
  fechaHasta: "",
  orden: "desc",
};

export const ActividadSocioModal = ({ isOpen, onClose, cuit, denominacion }) => {
  const [verbo, setVerbo] = useState(FILTROS_DEFECTO.verbo);
  const [busqueda, setBusqueda] = useState(FILTROS_DEFECTO.busqueda);
  const [fechaDesde, setFechaDesde] = useState(FILTROS_DEFECTO.fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(FILTROS_DEFECTO.fechaHasta);
  const [orden, setOrden] = useState(FILTROS_DEFECTO.orden);
  const [visibles, setVisibles] = useState(ELEMENTOS_POR_TANDA);

  const { data, isLoading, isError } = useActividadSocio(cuit, isOpen);

  const actividad = useMemo(() => {
    const lista = Array.isArray(data) ? data : [];
    return [...lista].sort((a, b) =>
      orden === "desc"
        ? new Date(b.momento) - new Date(a.momento)
        : new Date(a.momento) - new Date(b.momento),
    );
  }, [data, orden]);

  // Tipos de operación realmente presentes en el log de esta empresa (no
  // tiene sentido ofrecer "DELETE" en el desplegable si nunca hubo una baja)
  // — se calcula sobre el total sin filtrar para que las opciones no
  // aparezcan/desaparezcan al jugar con los otros filtros.
  const opcionesVerbo = useMemo(() => {
    const conteos = {};
    actividad.forEach((item) => {
      const { verbo: v } = parseActividad(item.descripcion);
      conteos[v] = (conteos[v] || 0) + 1;
    });
    const dinamicas = ORDEN_VERBOS.filter((v) => conteos[v] > 0).map((v) => ({
      value: v,
      label: `${v.toUpperCase()} (${conteos[v]})`,
    }));
    return [{ value: "todas", label: "Todos los tipos" }, ...dinamicas];
  }, [actividad]);

  const fechaDesdeDate = fechaDesde ? new Date(fechaDesde) : undefined;
  const fechaHastaDate = fechaHasta ? new Date(fechaHasta) : undefined;

  const actividadFiltrada = useMemo(() => {
    let lista = actividad;

    if (verbo !== "todas") {
      lista = lista.filter((item) => parseActividad(item.descripcion).verbo === verbo);
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
    !!fechaDesde ||
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
    setFechaDesde(value);
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
    setFechaDesde(FILTROS_DEFECTO.fechaDesde);
    setFechaHasta(FILTROS_DEFECTO.fechaHasta);
    setOrden(FILTROS_DEFECTO.orden);
    resetVisibles();
  };

  const handleClose = () => {
    limpiarFiltros();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Actividad de la empresa"
      subtitle={denominacion ? `${denominacion} · CUIT ${cuit}` : `CUIT ${cuit}`}
      maxWidth="640px"
      variant="blue"
    >
      {/* Barra de filtros compacta: buscador + una sola fila con los 4
          selects y el botón de limpiar, en vez de la grilla 2x2 con el
          botón de limpiar huérfano en su propia línea de la versión
          anterior. Pensada para el ancho real del modal, no calcada de
          Dashboard.jsx/Solicitudes.jsx (esas tienen todo el ancho de la
          pantalla disponible). */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar en el log..."
            value={busqueda}
            onChange={(e) => handleBusqueda(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterControlsRow}>
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
              label="Tipo"
              value={verbo}
              onChange={handleVerbo}
              options={opcionesVerbo}
              isSearchable={false}
              hideErrorSpace
              compact
              variant="admin"
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

          <button
            type="button"
            className={`${styles.clearFiltersBtn} ${hayFiltrosActivos ? styles.clearFiltersBtnVisible : ""}`}
            onClick={limpiarFiltros}
            disabled={!hayFiltrosActivos}
            tabIndex={hayFiltrosActivos ? 0 : -1}
            title="Limpiar filtros"
            aria-label="Limpiar filtros"
          >
            <FiX />
          </button>
        </div>

        {!isLoading && actividad.length > 0 && (
          <div className={styles.resultsBar}>
            <span className={styles.contador}>
              {actividadFiltrada.length}
              {actividadFiltrada.length !== actividad.length ? ` de ${actividad.length}` : ""} registro
              {actividadFiltrada.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className={styles.skeletonList}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.skeletonRow}>
              <Skeleton width="1.7rem" height="1.7rem" radius="50%" />
              <div style={{ flex: 1 }}>
                <Skeleton width="60%" height="0.8rem" />
                <Skeleton width="35%" height="0.65rem" style={{ marginTop: "0.4rem" }} />
              </div>
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
          <span>No hay actividad que coincida con los filtros aplicados.</span>
          <button type="button" className={styles.limpiarFiltrosInline} onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          <ul className={styles.lista}>
            {actividadFiltrada.slice(0, visibles).map((item) => (
              <ActividadItem key={item.logactividadid} item={item} />
            ))}
          </ul>
          {visibles < actividadFiltrada.length && (
            <button
              type="button"
              className={styles.cargarMas}
              onClick={() => setVisibles((v) => v + ELEMENTOS_POR_TANDA)}
            >
              <FiActivity size={13} />
              Ver más actividad ({actividadFiltrada.length - visibles} restante
              {actividadFiltrada.length - visibles !== 1 ? "s" : ""})
            </button>
          )}
        </>
      )}
    </Modal>
  );
};
