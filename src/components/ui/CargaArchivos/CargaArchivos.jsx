import React, { useEffect, useState, useSyncExternalStore } from 'react';
import styles from './CargaArchivos.module.css';
import {
  FiUploadCloud,
  FiFileText,
  FiTrash2,
  FiEye,
  FiDownload,
  FiRefreshCw,
  FiShield,
  FiCamera,
  FiCheck,
  FiAlertCircle,
} from 'react-icons/fi';
import { Spinner } from "../Spinner/Spinner";
import { TAMANIO_MAXIMO_ARCHIVO_MB } from "../../../utils/fileUtils";

// Mismo corte que el resto de la app (< 48rem = mobile): ahí la zona grande
// no entra cómoda y todo pasa a la fila compacta. Coarse pointer cubre
// tablets: tienen cámara aunque el ancho ya sea "de escritorio".
const MQ_MOBILE = "(max-width: 47.99rem)";
const MQ_TACTIL = "(pointer: coarse)";

// Una función de suscripción estable por query: si se creara en cada
// render, useSyncExternalStore se desuscribiría y volvería a suscribir cada vez.
const suscripciones = new Map();
const suscribirA = (query) => {
  if (!suscripciones.has(query)) {
    suscripciones.set(query, (avisar) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", avisar);
      return () => mq.removeEventListener("change", avisar);
    });
  }
  return suscripciones.get(query);
};

const useMedia = (query) =>
  useSyncExternalStore(
    suscribirA(query),
    () => window.matchMedia(query).matches,
    () => false,
  );

const EXT_IMAGEN = ["jpg", "jpeg", "png", "gif", "webp"];

const extensionDe = (nombre) => {
  const partes = String(nombre || "").split(".");
  return partes.length > 1 ? partes.pop().toLowerCase() : "";
};

const tipoDeArchivo = ({ name, fuente }) => {
  const mime = String(fuente?.type || "");
  if (mime.startsWith("image/")) return "imagen";
  if (mime === "application/pdf") return "pdf";
  const ext = extensionDe(name);
  if (EXT_IMAGEN.includes(ext)) return "imagen";
  if (ext === "pdf") return "pdf";
  return "otro";
};

// Acepta tanto el texto ya formateado que mandan algunos consumidores
// ("1.2 MB", "Disponible") como bytes crudos de un File.
const formatearTamanio = (size) => {
  if (typeof size !== "number") return size || "";
  if (size < 1024) return `${size} B`;
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

// Miniatura real para imágenes de un File/Blob recién elegido (se lee como
// data URL - con object URLs el doble montaje de StrictMode revocaba la URL
// antes de que la <img> la usara). PDFs y archivos del backend, que no traen
// contenido en el listado, quedan con el dibujo genérico.
const useMiniatura = (file, tipo) => {
  const fuente = file?.fuente;
  const esBlob = typeof Blob !== "undefined" && fuente instanceof Blob;
  const leerBlob = esBlob && tipo === "imagen";
  const [leida, setLeida] = useState({ fuente: null, src: null });

  useEffect(() => {
    if (!leerBlob) return undefined;
    const lector = new FileReader();
    lector.onload = () => setLeida({ fuente, src: lector.result });
    lector.readAsDataURL(fuente);
    return () => {
      lector.onload = null;
      if (lector.readyState === FileReader.LOADING) lector.abort();
    };
  }, [fuente, leerBlob]);

  return leerBlob && leida.fuente === fuente ? leida.src : null;
};

// Hoja con la franja del formato abajo (roja para PDF): se usa cuando no
// hay imagen real para mostrar.
const HojaDocumento = ({ ext, chica = false }) => (
  <span className={`${styles.hoja} ${chica ? styles.hojaChica : ""}`} aria-hidden="true">
    <span className={styles.hojaLinea} />
    <span className={styles.hojaLinea} />
    <span className={styles.hojaLinea} />
    <span className={`${styles.hojaBanda} ${ext === "PDF" ? styles.hojaBandaPdf : ""}`}>
      {ext || "DOC"}
    </span>
  </span>
);

// eslint-disable-next-line no-unused-vars
const BotonAccion = ({ icon: Icono, label, onClick, variante, isLoading, isDone }) => (
  <button
    type="button"
    className={`${styles.accion} ${variante === "danger" ? styles.accionDanger : ""} ${isDone ? styles.accionHecha : ""}`}
    onClick={(e) => {
      e.stopPropagation();
      onClick(e);
    }}
    aria-label={label}
    title={label}
    disabled={isLoading || isDone}
  >
    {isLoading ? <Spinner size={14} /> : isDone ? <FiCheck aria-hidden="true" /> : <Icono aria-hidden="true" />}
  </button>
);

export const CargaArchivos = ({
  title = "Subí tu archivo",
  // Texto de ayuda del estado vacío. Sin pasarlo, la zona grande arma el
  // "Arrastrá el archivo o elegilo" por defecto y la fila no muestra nada
  // extra antes de los formatos.
  subtitle,
  // Ícono del estado vacío (tile de la zona / fila sin ilustración).
  icon: Icon,
  // Dibujo propio para la izquierda de la fila (ej. DNI frente/dorso en
  // SocioAccionistaModal). Gana sobre `icon` en la variante fila.
  ilustracion = null,
  // El límite de 50MB es real para archivos sueltos (PDFs, comprobantes),
  // pero no aplica a fotos de DNI - ahí no tiene sentido mostrarlo.
  showMaxSizeHint = true,
  formatos = null,
  onCamara,
  // "zona" (grande, centrada, para pantallas con espacio) o "fila"
  // (compacta, para modales). En mobile siempre se usa la fila.
  variant,
  // Compatibilidad: `compact` era la versión achicada que usaban los
  // modales; ahora equivale a variant="fila".
  compact = false,
  file,
  isDragging,
  onDrop,
  onDragOver,
  onDragLeave,
  onClick,
  onEdit,
  onView,
  onDownload,
  onDelete,
  hasError = false,
  // Motivo puntual del error (ej. "El archivo supera los 50 MB"). Con
  // mensaje, el botón pasa a "Elegir otro"; sin él, hasError solo marca
  // en rojo (típicamente "falta cargar este obligatorio").
  mensajeError = null,
  isUploading = false,
  isLoading = false,
  // Legajo bloqueado / sin permisos: se ve, pero no se puede subir ni
  // reemplazar (ver y descargar siguen disponibles).
  disabled = false,
  // Acentos azules del panel admin. Además de esta prop, también se toma
  // .admin-theme de un ancestro, pero los modales van por portal al body y
  // ahí ese ancestro no existe.
  admin = false,
  // "cargando" | "listo" | null - ver useDescargaConFeedback.
  faseDescarga = null,
  className = "",
  style = {}
}) => {
  const [internalIsDragging, setInternalIsDragging] = useState(false);
  const esMobile = useMedia(MQ_MOBILE);
  const esTactil = useMedia(MQ_TACTIL);

  const variante = esMobile ? "fila" : variant || (compact ? "fila" : "zona");
  const esFila = variante === "fila";

  const tipo = file ? tipoDeArchivo(file) : null;
  const miniatura = useMiniatura(file, tipo);

  const activeIsDragging = !disabled && (isDragging !== undefined ? isDragging : internalIsDragging);
  const IconoVacio = Icon || (esFila ? FiFileText : FiUploadCloud);

  const clasesBase = [
    styles.box,
    esFila ? styles.fila : styles.zona,
    admin ? styles.admin : "",
    disabled ? styles.deshabilitado : "",
    className,
  ].join(" ");

  const izquierdaFila = ilustracion ? (
    <span className={styles.ilustracion} aria-hidden="true">{ilustracion}</span>
  ) : (
    <span className={styles.tileChico} aria-hidden="true"><IconoVacio /></span>
  );

  if (isLoading) {
    return (
      <div className={`${clasesBase} ${styles.esqueleto}`} style={style} aria-busy="true">
        <span className={styles.srOnly}>Cargando archivo...</span>
        <span className={`${styles.skel} ${esFila ? styles.skelThumbFila : styles.skelThumbZona}`} />
        <span className={styles.skelTextos}>
          <span className={`${styles.skel} ${styles.skelLinea}`} />
          <span className={`${styles.skel} ${styles.skelLinea} ${styles.skelLineaCorta}`} />
        </span>
      </div>
    );
  }

  if (isUploading) {
    return (
      <div className={`${clasesBase} ${styles.subiendo}`} style={style} role="status" aria-live="polite">
        <div className={styles.filaInterna}>
          {esFila ? (
            izquierdaFila
          ) : (
            <span className={styles.tile} aria-hidden="true"><Spinner size={20} /></span>
          )}
          <span className={styles.textos}>
            <strong className={styles.titulo}>{esFila ? title : "Subiendo archivo..."}</strong>
            <span className={styles.hint}>
              {esFila ? "Subiendo archivo..." : "Puede tardar unos segundos si el archivo es grande."}
            </span>
          </span>
        </div>
        <span className={styles.barra} aria-hidden="true"><i /></span>
      </div>
    );
  }

  if (file) {
    const ext = extensionDe(file.name).toUpperCase().slice(0, 4);
    const tamanio = formatearTamanio(file.size);
    const esLufe = String(file.vialufe) === "1";

    const miniaturaContenido = miniatura ? (
      <img className={styles.miniaturaImg} src={miniatura} alt="" />
    ) : esFila && tipo !== "pdf" ? (
      // Sin imagen real (backend sin contenido, o archivo que no es foto)
      // la fila muestra una tarjetita genérica, del mismo tamaño que la
      // foto, para que la grilla no salte cuando llega el archivo.
      <span className={styles.tarjetaGenerica} aria-hidden="true">
        <span /><span /><span />
      </span>
    ) : (
      <HojaDocumento ext={tipo === "pdf" ? "PDF" : ext} chica={esFila} />
    );

    const miniaturaNodo = (
      <span className={`${styles.miniatura} ${esFila ? styles.miniaturaFila : styles.miniaturaZona}`}>
        {miniaturaContenido}
        {esFila && (
          <span className={styles.checkBadge} aria-hidden="true"><FiCheck /></span>
        )}
      </span>
    );

    return (
      <div className={`${clasesBase} ${styles.cargado}`} style={style}>
        <div className={styles.filaInterna}>
          {onView ? (
            <button
              type="button"
              className={styles.miniaturaBtn}
              onClick={onView}
              aria-label={`Ver ${file.name}`}
              title="Ver archivo"
            >
              {miniaturaNodo}
            </button>
          ) : (
            miniaturaNodo
          )}

          <span className={styles.textos}>
            {esFila && title ? (
              <>
                <strong className={styles.titulo}>{title}</strong>
                <span className={`${styles.hint} ${styles.ellipsis}`} title={file.name}>
                  {file.name}{tamanio ? ` · ${tamanio}` : ""}
                </span>
              </>
            ) : (
              <>
                <strong className={`${styles.titulo} ${styles.ellipsis}`} title={file.name}>{file.name}</strong>
                {tamanio && <span className={styles.hint}>{tamanio}</span>}
              </>
            )}
            {(!esFila || esLufe) && (
              <span className={styles.chips}>
                {!esFila && (
                  <span className={styles.chipCargado}>
                    <FiCheck aria-hidden="true" /> Cargado
                  </span>
                )}
                {esLufe && (
                  <span className={styles.lufeBadge}>
                    <FiShield aria-hidden="true" /> Obtenido vía LUFE
                  </span>
                )}
              </span>
            )}
          </span>

          <span className={styles.acciones}>
            {onView && <BotonAccion icon={FiEye} label="Ver archivo" onClick={onView} />}
            {onDownload && (
              <BotonAccion
                icon={FiDownload}
                label="Descargar archivo"
                onClick={onDownload}
                isLoading={faseDescarga === "cargando"}
                isDone={faseDescarga === "listo"}
              />
            )}
            {onEdit && !disabled && (
              <BotonAccion icon={FiRefreshCw} label="Reemplazar archivo" onClick={onEdit} />
            )}
            {onDelete && !disabled && (
              <BotonAccion icon={FiTrash2} label="Eliminar archivo" onClick={onDelete} variante="danger" />
            )}
          </span>
        </div>
      </div>
    );
  }

  const abrir = () => {
    if (!disabled && onClick) onClick();
  };

  const handlersDrop = disabled
    ? {}
    : {
        onDrop: (e) => {
          e.preventDefault();
          e.stopPropagation();
          setInternalIsDragging(false);
          if (onDrop) onDrop(e);
        },
        onDragOver: (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!internalIsDragging) setInternalIsDragging(true);
          if (onDragOver) onDragOver(e);
        },
        onDragEnter: (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!internalIsDragging) setInternalIsDragging(true);
        },
        onDragLeave: (e) => {
          e.preventDefault();
          e.stopPropagation();
          // Pasar por encima de un hijo (ej. el botón "Subir") dispara
          // dragleave en la caja: no es salir de verdad.
          if (e.currentTarget.contains(e.relatedTarget)) return;
          setInternalIsDragging(false);
          if (onDragLeave) onDragLeave(e);
        },
      };

  const clasesVacio = `${clasesBase} ${styles.vacio} ${activeIsDragging ? styles.dragging : ""} ${hasError ? styles.error : ""}`;
  const tamanioMax = showMaxSizeHint ? `hasta ${TAMANIO_MAXIMO_ARCHIVO_MB} MB` : null;

  if (esFila) {
    const mostrarCamara = Boolean(onCamara) && (esMobile || esTactil) && !disabled;
    const hint = mensajeError || [subtitle, formatos, tamanioMax].filter(Boolean).join(" · ");
    const textoBoton = mensajeError ? "Elegir otro" : "Subir";

    return (
      // La fila entera abre el selector con el mouse por comodidad; con
      // teclado se llega por los botones reales de adentro.
      <div className={clasesVacio} style={style} onClick={abrir} aria-disabled={disabled || undefined} {...handlersDrop}>
        <div className={styles.filaInterna}>
          {izquierdaFila}
          <span className={styles.textos}>
            <strong className={styles.titulo}>
              {activeIsDragging ? "Soltá el archivo acá" : title}
            </strong>
            {hint && (
              <span className={`${styles.hint} ${hasError ? styles.hintError : ""}`}>
                {mensajeError && <FiAlertCircle aria-hidden="true" />}
                {hint}
              </span>
            )}
          </span>
          {!mostrarCamara && !disabled && (
            <button
              type="button"
              className={styles.btnSubir}
              onClick={(e) => {
                e.stopPropagation();
                abrir();
              }}
              aria-label={`${textoBoton}: ${title}`}
            >
              {!mensajeError && <FiUploadCloud aria-hidden="true" />}
              {textoBoton}
            </button>
          )}
        </div>
        {mostrarCamara && (
          <div className={styles.botonesMobile}>
            <button
              type="button"
              className={styles.btnCamara}
              onClick={(e) => {
                e.stopPropagation();
                onCamara();
              }}
            >
              <FiCamera aria-hidden="true" />
              Sacar foto
            </button>
            <button
              type="button"
              className={styles.btnElegir}
              onClick={(e) => {
                e.stopPropagation();
                abrir();
              }}
            >
              <FiUploadCloud aria-hidden="true" />
              {mensajeError ? "Elegir otro" : "Elegir"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={clasesVacio}
      style={style}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-label={`${title}. Arrastrá el archivo o presioná Enter para elegirlo`}
      onClick={abrir}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrir();
        }
      }}
      {...handlersDrop}
    >
      <span className={styles.tile} aria-hidden="true"><IconoVacio /></span>
      <strong className={styles.titulo}>
        {activeIsDragging ? "Soltá el archivo acá" : title}
      </strong>
      {!activeIsDragging && (
        <span className={`${styles.hint} ${hasError && !mensajeError ? styles.hintError : ""}`}>
          {subtitle || (
            <>
              Arrastrá el archivo o <span className={styles.elegilo}>elegilo</span>
            </>
          )}
          {formatos && ` · ${formatos}`}
          {tamanioMax && ` · ${tamanioMax}`}
        </span>
      )}
      {mensajeError && !activeIsDragging && (
        <span className={`${styles.hint} ${styles.hintError}`}>
          <FiAlertCircle aria-hidden="true" /> {mensajeError}
        </span>
      )}
      {onCamara && esTactil && !disabled && (
        <button
          type="button"
          className={styles.btnCamaraZona}
          onClick={(e) => {
            e.stopPropagation();
            onCamara();
          }}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <FiCamera aria-hidden="true" />
          Sacar foto
        </button>
      )}
    </div>
  );
};
