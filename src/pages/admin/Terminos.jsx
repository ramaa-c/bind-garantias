import React, { useState } from "react";
import { FiSave, FiEye, FiEdit3, FiFileText, FiClock, FiCheckCircle } from "react-icons/fi";
import { toast } from "sonner";
import {
  RAW_TERMINOS_Y_CONDICIONES_DEFAULT,
  parseTerminos,
} from "../../constants/terminosCondiciones";
import styles from "./Terminos.module.css";

const documentosIniciales = {
  terminos: {
    titulo: "Términos y Condiciones Generales",
    version: "v1.0",
    ultimaModificacion: "10/06/2026",
    contenido: "", // Se inicializará desde localStorage o default
  },
};

export default function Terminos() {
  const [docs, setDocs] = useState(() => {
    const termContent = localStorage.getItem("terminos_y_condiciones_content") || RAW_TERMINOS_Y_CONDICIONES_DEFAULT;
    return {
      ...documentosIniciales,
      terminos: {
        ...documentosIniciales.terminos,
        contenido: termContent,
      },
    };
  });
  const [docActivo, setDocActivo] = useState("terminos");
  const [modoVista, setModoVista] = useState("editar"); // editar | vista

  const [textoEditable, setTextoEditable] = useState(docs.terminos.contenido);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  const handleSelectDoc = (key) => {
    if (hasUnsaved) {
      const confirmacion = window.confirm("Tenés cambios sin guardar. ¿Querés cambiar de documento de todos modos?");
      if (!confirmacion) return;
    }
    setDocActivo(key);
    setTextoEditable(docs[key].contenido);
    setHasUnsaved(false);
  };

  const handleChangeTexto = (val) => {
    setTextoEditable(val);
    setHasUnsaved(true);
  };

  const handleGuardarCambios = () => {
    const nextVersion = "v" + (parseFloat(docs[docActivo].version.replace("v", "")) + 0.1).toFixed(1);
    const today = new Date().toLocaleDateString("es-AR");

    setDocs((prev) => {
      const updatedDocs = {
        ...prev,
        [docActivo]: {
          ...prev[docActivo],
          contenido: textoEditable,
          ultimaModificacion: today,
          version: nextVersion,
        },
      };

      if (docActivo === "terminos") {
        localStorage.setItem("terminos_y_condiciones_content", textoEditable);
      }

      return updatedDocs;
    });

    setHasUnsaved(false);
    toast.success("Documento legal actualizado", {
      description: `Los nuevos "${docs[docActivo].titulo}" requieren nueva aceptación por los usuarios tras el próximo inicio de sesión.`,
    });
  };

  const currentDoc = docs[docActivo];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Edición de Documentación Legal y TyC</h1>
          <p>
            Actualizá las cláusulas de Términos y Condiciones, Criterios de Aceptación y
            Disclaimers. Al publicar, el sistema puede solicitar la re-aceptación de los socios.
          </p>
        </div>
        <button type="button"
          onClick={handleGuardarCambios}
          className={`${styles.btnPublish} ${hasUnsaved ? styles.btnPublishGlow : ""}`}
          disabled={!hasUnsaved}
        >
          <FiSave /> Publicar Nueva Versión
        </button>
      </div>

      <div className={styles.editorWorkspace}>
        {/* Barra Lateral de Selección de Documentos */}
        <div className={styles.docSelectSidebar}>
          <h3 className={styles.sideTitle}>Documentos Disponibles</h3>
          <div className={styles.docsList}>
            {Object.keys(docs).map((k) => {
              const d = docs[k];
              const isSelected = k === docActivo;
              return (
                <button type="button"
                  key={k}
                  onClick={() => handleSelectDoc(k)}
                  className={`${styles.docCardBtn} ${isSelected ? styles.activeDoc : ""}`}
                >
                  <FiFileText className={styles.docIcon} />
                  <div className={styles.docMeta}>
                    <span className={styles.docName}>{d.titulo}</span>
                    <span className={styles.docVers}>Versión actual: {d.version}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className={styles.infoCardNote}>
            <h4>⚠️ Notificación a Socios</h4>
            <p>
              Modificar cláusulas críticas marca automáticamente las firmas digitales previas
              como desactualizadas para la operatoria futura.
            </p>
          </div>
        </div>

        {/* Panel Central de Edición */}
        <div className={styles.mainEditorPanel}>
          <div className={styles.editorHead}>
            <div className={styles.headLeft}>
              <h2>{currentDoc.titulo}</h2>
              <span className={styles.versionBadge}>{currentDoc.version}</span>
              <span className={styles.timestampInfo}>
                <FiClock /> Última actualización: {currentDoc.ultimaModificacion}
              </span>
            </div>

            {/* Selector de Tabs Editor / Preview */}
            <div className={styles.modeTabs}>
              <button type="button"
                className={`${styles.modeBtn} ${modoVista === "editar" ? styles.modeActive : ""}`}
                onClick={() => setModoVista("editar")}
              >
                <FiEdit3 /> Modo Editor
              </button>
              <button type="button"
                className={`${styles.modeBtn} ${modoVista === "vista" ? styles.modeActive : ""}`}
                onClick={() => setModoVista("vista")}
              >
                <FiEye /> Vista Previa
              </button>
            </div>
          </div>

          <div className={styles.editorBody}>
            {modoVista === "editar" ? (
              <div className={styles.textareaWrapper}>
                <textarea
                  value={textoEditable}
                  onChange={(e) => handleChangeTexto(e.target.value)}
                  className={styles.richTextarea}
                  placeholder="Escribí aquí las cláusulas en formato texto o Markdown simple..."
                />
                <div className={styles.editorFooter}>
                  <span>Formato compatible con párrafos y saltos de línea automáticos.</span>
                  <span>Caracteres: {textoEditable.length}</span>
                </div>
              </div>
            ) : (
              <div className={styles.previewPanel}>
                <div className={styles.previewContent}>
                  {parseTerminos(textoEditable).map((seccion, sIdx) => (
                    <div key={seccion.id || sIdx} className={styles.previewSeccion}>
                      {seccion.titulo && (
                        <h3 className={styles.previewHeading}>{seccion.titulo}</h3>
                      )}

                      {seccion.esTabla ? (
                        <table className={styles.tablaPreview}>
                          <tbody>
                            {(seccion.tableRows || []).map((row, rIdx) => (
                              <tr key={rIdx}>
                                <td className={styles.tablaTermPreview}>{row.term}</td>
                                <td className={styles.tablaDefPreview}>{row.definition}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        (seccion.parrafos || []).map((parrafo, pIdx) => (
                          <p key={pIdx} className={styles.previewParagraph}>
                            {parrafo}
                          </p>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
