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
} from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Skeleton } from "../../../ui/Skeleton/Skeleton";
import { useActividadSocio } from "../../../../hooks/useSocios";
import styles from "./ActividadSocioModal.module.css";

const ELEMENTOS_POR_TANDA = 12;

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
// color/ícono) de la entidad (define el texto legible).
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

const FILTROS = [
  { key: "todas", label: "Todas" },
  { key: "lectura", label: "Consultas" },
  { key: "cambios", label: "Cambios" },
];

const ActividadItem = ({ item }) => {
  const [expandido, setExpandido] = useState(false);
  const { verbo, label } = useMemo(() => parseActividad(item.descripcion), [item.descripcion]);
  const meta = VERBOS[verbo] || VERBOS.get;
  const detalle = useMemo(() => parseDetalle(item.detalleactividad), [item.detalleactividad]);
  const usuarioWebId = item.usuariowebid;

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
              <span className={styles.itemUsuario}>
                <FiUser size={10} /> Usuario #{usuarioWebId}
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

export const ActividadSocioModal = ({ isOpen, onClose, cuit, denominacion }) => {
  const [filtro, setFiltro] = useState("todas");
  const [visibles, setVisibles] = useState(ELEMENTOS_POR_TANDA);

  const { data, isLoading, isError } = useActividadSocio(cuit, isOpen);

  const actividad = useMemo(() => {
    const lista = Array.isArray(data) ? data : [];
    return [...lista].sort((a, b) => new Date(b.momento) - new Date(a.momento));
  }, [data]);

  const actividadFiltrada = useMemo(() => {
    if (filtro === "todas") return actividad;
    return actividad.filter((item) => {
      const { verbo } = parseActividad(item.descripcion);
      const esLectura = verbo === "get";
      return filtro === "lectura" ? esLectura : !esLectura;
    });
  }, [actividad, filtro]);

  const handleFiltro = (key) => {
    setFiltro(key);
    setVisibles(ELEMENTOS_POR_TANDA);
  };

  const handleClose = () => {
    setFiltro("todas");
    setVisibles(ELEMENTOS_POR_TANDA);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Actividad de la empresa"
      subtitle={denominacion ? `${denominacion} · CUIT ${cuit}` : `CUIT ${cuit}`}
      maxWidth="560px"
      variant="blue"
    >
      <div className={styles.filtros}>
        {FILTROS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`${styles.filtroChip} ${filtro === f.key ? styles.filtroChipActivo : ""}`}
            onClick={() => handleFiltro(f.key)}
          >
            {f.label}
          </button>
        ))}
        {!isLoading && (
          <span className={styles.contador}>
            {actividadFiltrada.length} registro{actividadFiltrada.length !== 1 ? "s" : ""}
          </span>
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
      ) : isError || actividadFiltrada.length === 0 ? (
        <div className={styles.emptyState}>
          <FiInbox className={styles.emptyStateIcon} />
          <span>
            {isError
              ? "No se pudo obtener el log de actividad."
              : "Sin actividad registrada para esta empresa."}
          </span>
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
