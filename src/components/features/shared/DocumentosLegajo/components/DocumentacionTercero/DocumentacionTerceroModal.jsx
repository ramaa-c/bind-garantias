import React, { useState } from "react";
import { toast } from "sonner";
import { FiCheck, FiFileText } from "react-icons/fi";
import { Modal } from "../../../../../ui/Modal/Modal";
import { Button } from "../../../../../ui/Button/Button";
import { CargaArchivos } from "../../../../../ui/CargaArchivos/CargaArchivos";
import { socioArchivoService } from "../../../../../../services/socioArchivoService";
import {
  FORMATOS_ARCHIVO,
  TAMANIO_MAXIMO_ARCHIVO_MB,
  procesarArchivo,
  validarTamanioArchivo,
  validarTipoArchivo,
} from "../../../../../../utils/fileUtils";
import { mensajeNegocio } from "../../../../../../utils/mensajesError";
import { useDescargaConFeedback } from "../../../../../../hooks/useDescargaConFeedback";
import {
  REQUERIMIENTO_OBLIGATORIO,
  descripcionArchivoTercero,
  esDocumentoDni,
} from "../../../../../../utils/documentacionTerceros";
import { DibujoDniDorso, DibujoDniFrente } from "./DibujosDni";
import styles from "./DocumentacionTerceroModal.module.css";

const esAdminPath = () => typeof window !== "undefined" && window.location.pathname.includes("/admin");

// Una fila por documento. Cada archivo se guarda en el momento en que se
// elige (no hay un "Guardar" general que se pueda olvidar): la lista se
// refresca con onCambio y la fila pasa a "cargado".
function FilaDocumento({ item, persona, socioIdActivo, onCambio, descargar, faseDe, isAdmin }) {
  const [subiendo, setSubiendo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState(null);
  const inputId = `doc-tercero-${item.clave}`;
  const camaraId = `doc-tercero-camara-${item.clave}`;
  const esDni = esDocumentoDni(item.tipoDocumentoId);
  const opcional = item.requerimiento !== REQUERIMIENTO_OBLIGATORIO;

  const subir = async (archivo, formato = FORMATOS_ARCHIVO.documento) => {
    if (!archivo || subiendo) return;
    if (!validarTipoArchivo(archivo, formato)) {
      setErrorArchivo(`Formato no permitido · usá ${formato.etiqueta}`);
      return;
    }
    if (!validarTamanioArchivo(archivo)) {
      setErrorArchivo(`El archivo supera los ${TAMANIO_MAXIMO_ARCHIVO_MB} MB`);
      return;
    }
    setErrorArchivo(null);
    setSubiendo(true);
    try {
      const descripcion = descripcionArchivoTercero({
        clave: item.clave,
        titulo: item.titulo,
        cuit: persona.cuit,
        nombre: persona.nombre,
      });
      if (item.archivo) {
        await socioArchivoService.actualizarArchivo(item.archivo, archivo, item.clave, descripcion);
      } else {
        await socioArchivoService.subirArchivo(socioIdActivo, archivo, item.clave, descripcion);
      }
      await onCambio();
      toast.success(`${item.titulo} cargado`);
    } catch (err) {
      setErrorArchivo(
        err?.esValidacionArchivo ? err.message : mensajeNegocio(err, "No se pudo subir el archivo. Probá de nuevo."),
      );
    } finally {
      setSubiendo(false);
    }
  };

  const archivoParaVer = item.archivo
    ? { _backendId: item.archivo.socioarchivoid, name: item.archivo.nombrearchivo }
    : null;
  const abrirSelector = () => document.getElementById(inputId)?.click();

  return (
    <div className={styles.fila}>
      <input
        type="file"
        id={inputId}
        hidden
        accept={FORMATOS_ARCHIVO.documento.accept}
        onChange={(e) => {
          subir(e.target.files?.[0]);
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
            subir(e.target.files?.[0], FORMATOS_ARCHIVO.imagen);
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
        isLoading={subiendo}
        hasError={Boolean(errorArchivo)}
        mensajeError={errorArchivo}
        file={
          item.archivo
            ? {
                name: item.archivo.nombrearchivo,
                size: "Disponible",
                vialufe: item.archivo.vialufe || item.archivo.Vialufe || "0",
              }
            : null
        }
        onClick={abrirSelector}
        onEdit={abrirSelector}
        onView={() => procesarArchivo(archivoParaVer, socioArchivoService.obtenerContenido, "view", item.titulo)}
        onDownload={() =>
          descargar(item.clave, () =>
            procesarArchivo(archivoParaVer, socioArchivoService.obtenerContenido, "download", item.titulo),
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
          subir(e.dataTransfer.files?.[0]);
        }}
      />
    </div>
  );
}

function Seccion({ numero, titulo, items, ...fila }) {
  const completa = items.every((i) => i.archivo);
  const obligatorios = items.filter((i) => i.requerimiento === REQUERIMIENTO_OBLIGATORIO);
  const pendientes = obligatorios.filter((i) => !i.archivo).length;
  const estado =
    obligatorios.length === 0
      ? "Opcional"
      : pendientes === 0
        ? "Completo"
        : pendientes === 1
          ? "1 obligatorio pendiente"
          : `${pendientes} obligatorios pendientes`;
  return (
    <section className={styles.seccion}>
      <h4 className={styles.seccionTitulo}>
        <span className={`${styles.seccionNum} ${completa ? styles.seccionNumOk : ""}`} aria-hidden="true">
          {completa ? <FiCheck /> : numero}
        </span>
        {titulo}
        <span className={styles.seccionEstado}>{estado}</span>
      </h4>
      <div className={titulo === "DNI" ? styles.gridDni : styles.lista}>
        {items.map((item) => (
          <FilaDocumento key={item.clave} item={item} {...fila} />
        ))}
      </div>
    </section>
  );
}

/**
 * Documentación de un tercero según lo que la cadena le pide a su tipo de
 * relación. Con solo DNI se ve como la sección de DNI de accionistas; con
 * más documentos, el DNI queda arriba y el resto como lista debajo.
 */
export function DocumentacionTerceroModal({ isOpen, onClose, persona, etiqueta, estado, socioIdActivo, onCambio }) {
  const { descargar, faseDe } = useDescargaConFeedback();
  if (!persona || !estado) return null;

  const isAdmin = esAdminPath();
  const dni = estado.items.filter((i) => esDocumentoDni(i.tipoDocumentoId));
  const otros = estado.items.filter((i) => !esDocumentoDni(i.tipoDocumentoId));
  const fila = { persona, socioIdActivo, onCambio, descargar, faseDe, isAdmin };
  const porcentaje = estado.total > 0 ? Math.round((estado.cargados / estado.total) * 100) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Documentación de ${persona.nombre}`}
      subtitle={[etiqueta, persona.cuit && `CUIT ${persona.cuit}`].filter(Boolean).join(" · ")}
      maxWidth={otros.length > 0 || dni.length > 1 ? "46rem" : "36rem"}
      footerClassName={styles.pie}
      footer={
        <>
          <span className={styles.pieAyuda}>Cada archivo se guarda al subirlo.</span>
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </>
      }
    >
      <div className={styles.cuerpo}>
        {estado.total > 2 && (
          <div className={styles.avance}>
            <span>
              <b>
                {estado.cargados} de {estado.total}
              </b>{" "}
              cargados
            </span>
            <span
              className={styles.avanceBarra}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={estado.total}
              aria-valuenow={estado.cargados}
              aria-label="Documentos cargados"
            >
              <i style={{ width: `${porcentaje}%` }} />
            </span>
          </div>
        )}
        {dni.length > 0 && <Seccion numero={1} titulo="DNI" items={dni} {...fila} />}
        {otros.length > 0 && (
          <Seccion
            numero={dni.length > 0 ? 2 : 1}
            titulo={dni.length > 0 ? "Otros documentos" : "Documentos"}
            items={otros}
            {...fila}
          />
        )}
      </div>
    </Modal>
  );
}

export default DocumentacionTerceroModal;
