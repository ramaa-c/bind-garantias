import React, { useState } from "react";
import { FiSave, FiEye, FiEdit3, FiFileText, FiClock, FiCheckCircle } from "react-icons/fi";
import { toast } from "sonner";
import styles from "./Terminos.module.css";

const documentosIniciales = {
  terminos: {
    titulo: "Términos y Condiciones Generales",
    version: "v2.4",
    ultimaModificacion: "18/03/2026",
    contenido: `## 1. Alcance y Aceptación
El presente documento regula el acceso y utilización del portal BIND Garantías y la emisión de garantías digitales, cheques avalados y pagarés bursátiles.

## 2. Obligaciones del Usuario (Socio)
El socio se compromete a mantener actualizada toda la documentación contable y fiscal en el legajo digital corporativo.

## 3. Modificaciones de Tasas
BIND Garantías se reserva el derecho de ajustar los topes y las tasas aplicables con previo aviso a través de notificaciones en el dashboard de la cuenta.`,
  },
  criterios: {
    titulo: "Criterios de Aceptación Crediticia",
    version: "v1.1",
    ultimaModificacion: "02/02/2026",
    contenido: `## 1. Parámetros de Riesgo
Todas las solicitudes superiores a $50.000.000 requieren la validación de un Oficial de Crédito Senior y aprobación unánime de la mesa de control.

## 2. Antigüedad Mínima
Se requiere un mínimo de 12 meses de actividad demostrable ante AFIP para el alta de nuevas líneas de financiamiento.`,
  },
  disclaimers: {
    titulo: "Disclaimers y Políticas de Privacidad",
    version: "v3.0",
    ultimaModificacion: "10/01/2026",
    contenido: `## Tratamiento de Datos Personales
Los datos ingresados se resguardan bajo estrictas normas de confidencialidad y en cumplimiento con la Ley de Protección de Datos Personales N° 25.326.`,
  },
};

export default function Terminos() {
  const [docs, setDocs] = useState(documentosIniciales);
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
    setDocs((prev) => ({
      ...prev,
      [docActivo]: {
        ...prev[docActivo],
        contenido: textoEditable,
        ultimaModificacion: "Recién",
        version: "v" + (parseFloat(prev[docActivo].version.replace("v", "")) + 0.1).toFixed(1),
      },
    }));
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
        <button
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
                <button
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
              <button
                className={`${styles.modeBtn} ${modoVista === "editar" ? styles.modeActive : ""}`}
                onClick={() => setModoVista("editar")}
              >
                <FiEdit3 /> Modo Editor
              </button>
              <button
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
                <div className={styles.previewNotice}>
                  <FiCheckCircle color="#3fb950" /> Así visualizará el cliente el documento legal en su pantalla de aceptación:
                </div>
                <div className={styles.previewContent}>
                  {textoEditable.split("\n\n").map((parrafo, idx) => {
                    if (parrafo.startsWith("## ")) {
                      return <h3 key={idx} className={styles.previewHeading}>{parrafo.replace("## ", "")}</h3>;
                    }
                    return <p key={idx} className={styles.previewParagraph}>{parrafo}</p>;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
