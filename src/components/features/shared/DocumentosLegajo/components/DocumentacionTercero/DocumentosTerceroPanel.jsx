import React, { useState } from "react";
import { FiAlertCircle, FiCheck, FiFileText, FiUser } from "react-icons/fi";
import { CargaArchivos } from "../../../../../ui/CargaArchivos/CargaArchivos";
import { socioArchivoService } from "../../../../../../services/socioArchivoService";
import {
  FORMATOS_ARCHIVO,
  TAMANIO_MAXIMO_ARCHIVO_MB,
  procesarArchivo,
  validarTamanioArchivo,
  validarTipoArchivo,
} from "../../../../../../utils/fileUtils";
import { useDescargaConFeedback } from "../../../../../../hooks/useDescargaConFeedback";
import { REQUERIMIENTO_OBLIGATORIO, esDocumentoDni } from "../../../../../../utils/documentacionTerceros";
import { DibujoDniDorso, DibujoDniFrente } from "./DibujosDni";
import styles from "./DocumentosTerceroPanel.module.css";

// Lo que se muestra de un archivo: el elegido en esta sesión (File, o el
// objeto del DNI que arma SocioAccionistaModal) o el que ya está en el backend.
const archivoVisible = (item) => {
  if (item.local) return item.local;
  if (!item.archivo) return null;
  return {
    name: item.archivo.nombrearchivo,
    _backendId: item.archivo.socioarchivoid,
    vialufe: item.archivo.vialufe || item.archivo.Vialufe || "0",
  };
};

function FilaDocumento({ item, onElegir, conError, isAdmin, descargar, faseDe, idBase }) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState(null);
  const inputId = `${idBase}-${item.clave}`;
  const camaraId = `${idBase}-camara-${item.clave}`;
  const esDni = esDocumentoDni(item.tipoDocumentoId);
  const opcional = item.requerimiento !== REQUERIMIENTO_OBLIGATORIO;
  const visible = archivoVisible(item);

  const aceptar = (archivo, formato = FORMATOS_ARCHIVO.documento) => {
    if (!archivo) return;
    if (!validarTipoArchivo(archivo, formato)) {
      setErrorArchivo(`Formato no permitido · usá ${formato.etiqueta}`);
      return;
    }
    if (!validarTamanioArchivo(archivo)) {
      setErrorArchivo(`El archivo supera los ${TAMANIO_MAXIMO_ARCHIVO_MB} MB`);
      return;
    }
    setErrorArchivo(null);
    onElegir(item.clave, archivo);
  };
  const abrirSelector = () => document.getElementById(inputId)?.click();

  return (
    <div className={styles.fila}>
      <input
        type="file"
        id={inputId}
        hidden
        accept={FORMATOS_ARCHIVO.documento.accept}
        onChange={(e) => {
          aceptar(e.target.files?.[0]);
          e.target.value = null;
        }}
      />
      {esDni && (
        <input
          type="file"
          id={camaraId}
          hidden
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            aceptar(e.target.files?.[0], FORMATOS_ARCHIVO.imagen);
            e.target.value = null;
          }}
        />
      )}
      <CargaArchivos
        variant="fila"
        title={opcional ? `${item.titulo} (opcional)` : item.titulo}
        subtitle={esDni ? "Foto clara, sin reflejos" : undefined}
        ilustracion={esDni ? item.clave === "socio-dorso" ? <DibujoDniDorso /> : <DibujoDniFrente /> : null}
        icon={esDni ? undefined : FiFileText}
        showMaxSizeHint={!esDni}
        formatos={FORMATOS_ARCHIVO.documento.etiqueta}
        onCamara={esDni ? () => document.getElementById(camaraId)?.click() : undefined}
        admin={isAdmin}
        hasError={conError || Boolean(errorArchivo)}
        mensajeError={errorArchivo}
        file={
          visible
            ? {
                name: visible.name,
                size: visible.size || "Disponible",
                vialufe: visible.vialufe || "0",
                fuente: visible instanceof Blob ? visible : null,
              }
            : null
        }
        onClick={abrirSelector}
        onEdit={abrirSelector}
        onView={() => procesarArchivo(visible, socioArchivoService.obtenerContenido, "view", item.titulo)}
        onDownload={() =>
          descargar(item.clave, () =>
            procesarArchivo(visible, socioArchivoService.obtenerContenido, "download", item.titulo),
          )
        }
        faseDescarga={faseDe(item.clave)}
        isDragging={isDragging}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          aceptar(e.dataTransfer.files?.[0]);
        }}
      />
    </div>
  );
}

function Seccion({ numero, titulo, items, esDni, filaProps, conSeparador, id }) {
  const completa = items.every((i) => i.archivo || i.local);
  const obligatorios = items.filter((i) => i.requerimiento === REQUERIMIENTO_OBLIGATORIO);
  const pendientes = obligatorios.filter((i) => !i.archivo && !i.local).length;
  const estado =
    obligatorios.length === 0
      ? "Opcional"
      : pendientes === 0
        ? "Completo"
        : pendientes === 1
          ? "1 obligatorio pendiente"
          : `${pendientes} obligatorios pendientes`;
  return (
    <section id={id} className={`${styles.seccion} ${conSeparador ? styles.seccionSeparada : ""}`}>
      <h4 className={styles.seccionTitulo}>
        <span className={`${styles.seccionNum} ${completa ? styles.seccionNumOk : ""}`} aria-hidden="true">
          {completa ? <FiCheck /> : numero}
        </span>
        {titulo}
        <span className={styles.seccionEstado}>{estado}</span>
      </h4>
      <div className={esDni ? styles.gridDni : styles.lista}>
        {items.map((item) => (
          <FilaDocumento
            key={item.clave}
            item={item}
            conError={filaProps.errores?.includes(item.clave)}
            {...filaProps}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Documentos de un tercero dentro de su modal. Con solo DNI se usa como la
 * sección "DNI" del formulario (numeroInicial = el número que le toca);
 * en la pestaña Documentación suma la barra de avance y "Otros documentos".
 */
export function DocumentosTerceroPanel({
  items,
  onElegir,
  errores = [],
  numeroInicial = 1,
  conAvance = false,
  // Como sección más del formulario (solo DNI): mismo separador que el resto.
  conSeparador = false,
  // id de la sección DNI (para bajar hasta ella, ver useIrASeccionDocumentos).
  idSeccion,
  isAdmin = false,
  idBase = "doc-tercero",
}) {
  const { descargar, faseDe } = useDescargaConFeedback();
  const dni = items.filter((i) => esDocumentoDni(i.tipoDocumentoId));
  const otros = items.filter((i) => !esDocumentoDni(i.tipoDocumentoId));
  const cargados = items.filter((i) => i.archivo || i.local).length;
  const filaProps = { onElegir, errores, isAdmin, descargar, faseDe, idBase };

  return (
    <div className={styles.cuerpo}>
      {conAvance && items.length > 0 && (
        <div className={styles.avance}>
          <span>
            <b>
              {cargados} de {items.length}
            </b>{" "}
            cargados
          </span>
          <span
            className={styles.avanceBarra}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={items.length}
            aria-valuenow={cargados}
            aria-label="Documentos cargados"
          >
            <i style={{ width: `${Math.round((cargados / items.length) * 100)}%` }} />
          </span>
        </div>
      )}
      {dni.length > 0 && (
        <Seccion
          numero={numeroInicial}
          titulo="DNI"
          items={dni}
          esDni
          filaProps={filaProps}
          conSeparador={conSeparador}
          id={idSeccion}
        />
      )}
      {otros.length > 0 && (
        <Seccion
          numero={numeroInicial + (dni.length > 0 ? 1 : 0)}
          titulo={dni.length > 0 ? "Otros documentos" : "Documentos"}
          items={otros}
          filaProps={filaProps}
        />
      )}
    </div>
  );
}

/** En el pie, mientras se ve Datos: qué falta y un acceso a la pestaña. */
export function AvisoDocumentacionPie({ cantidad, onClick }) {
  return (
    <button type="button" className={styles.avisoPie} onClick={onClick}>
      <FiAlertCircle aria-hidden="true" />
      {cantidad === 1 ? "Falta 1 documento" : `Faltan ${cantidad} documentos`}
    </button>
  );
}

export function PestanasTercero({ activa, onCambiar, cargados, total, faltan, datosCompletos, admin = false }) {
  const docCompleta = !faltan && cargados === total;
  return (
    <div className={`${styles.pestanas} ${admin ? styles.pestanasAdmin : ""}`} role="tablist" aria-label="Secciones del tercero">
      <button
        type="button"
        role="tab"
        aria-selected={activa === "datos"}
        className={`${styles.pestana} ${
          activa === "datos" ? `${styles.pestanaActiva} ${datosCompletos ? styles.pestanaActivaOk : ""}` : ""
        }`}
        onClick={() => onCambiar("datos")}
      >
        <FiUser className={styles.pestanaIcono} aria-hidden="true" />
        Datos
        {datosCompletos && (
          <span className={`${styles.pestanaEstado} ${styles.pestanaEstadoOk}`} aria-label="completos">
            <FiCheck aria-hidden="true" />
          </span>
        )}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activa === "documentacion"}
        className={`${styles.pestana} ${
          activa === "documentacion" ? `${styles.pestanaActiva} ${docCompleta ? styles.pestanaActivaOk : ""}` : ""
        }`}
        onClick={() => onCambiar("documentacion")}
      >
        <FiFileText className={styles.pestanaIcono} aria-hidden="true" />
        Documentación
        <span
          className={`${styles.pestanaCuenta} ${
            faltan ? styles.pestanaCuentaPendiente : docCompleta ? styles.pestanaCuentaOk : ""
          }`}
          aria-label={`${cargados} de ${total} cargados`}
        >
          {docCompleta && <FiCheck aria-hidden="true" />}
          {cargados}/{total}
        </span>
        {faltan && <span className={styles.pestanaPunto} aria-hidden="true" />}
      </button>
    </div>
  );
}

export default DocumentosTerceroPanel;
