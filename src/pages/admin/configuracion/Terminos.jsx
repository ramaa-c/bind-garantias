import React, { useState, useEffect } from "react";
import { FiSave, FiEye, FiEdit3, FiFileText, FiClock, FiAlertTriangle } from "react-icons/fi";
import { toast } from "sonner";
import { parseTerminos } from "../../../constants/terminosCondiciones";
import { ConfirmacionModal } from "../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { Spinner } from "../../../components/ui/Spinner/Spinner";
import { useObtenerTerminosVigentes, usePublicarTerminos } from "../../../hooks/useTerminos";
import { useUsuarioWebIdActual } from "../../../hooks/useUsuario";
import styles from "./Terminos.module.css";

const formatearMomento = (momento) => {
  if (!momento) return "—";
  const fecha = new Date(momento);
  if (Number.isNaN(fecha.getTime())) return "—";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(fecha);
};

const TITULO_TERMINOS = "Términos y Condiciones Generales";

export default function Terminos() {
  const usuarioWebId = useUsuarioWebIdActual();
  const { data: terminosVigentes, isLoading: isLoadingTerminos } = useObtenerTerminosVigentes();
  const { mutateAsync: publicarTerminos, isPending: isPublicando } = usePublicarTerminos();

  const [modoVista, setModoVista] = useState("editar"); // editar | vista
  const [textoEditable, setTextoEditable] = useState("");
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Sincroniza el editor con el texto vigente cuando llega/cambia, pero no
  // si el admin ya tiene cambios sin guardar en curso (no le pisamos lo que
  // está escribiendo).
  useEffect(() => {
    if (!hasUnsaved) {
      setTextoEditable(terminosVigentes?.textotyc || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminosVigentes]);

  const handleChangeTexto = (val) => {
    setTextoEditable(val);
    setHasUnsaved(true);
  };

  const handleGuardarCambios = () => {
    setConfirmOpen(true);
  };

  const confirmSave = async () => {
    try {
      await publicarTerminos({ textoTyC: textoEditable, usuarioWebId });
      setHasUnsaved(false);
      setConfirmOpen(false);
      toast.success("Documento legal actualizado", {
        description: `Los nuevos "${TITULO_TERMINOS}" requieren nueva aceptación por los usuarios en su próximo inicio de sesión.`,
      });
    } catch (err) {
      console.error("[Terminos] Error al publicar la nueva versión:", err);
      setConfirmOpen(false);
      toast.error("No se pudo publicar la nueva versión. Intentá nuevamente.");
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Edición de Documentación Legal y TyC</h1>
          <p>
            Actualizá las cláusulas de Términos y Condiciones. Al publicar, el sistema le
            vuelve a pedir la aceptación a los socios en su próximo inicio de sesión.
          </p>
        </div>
        <button type="button"
          onClick={handleGuardarCambios}
          className={`${styles.btnPublish} ${hasUnsaved ? styles.btnPublishGlow : ""}`}
          disabled={!hasUnsaved || isLoadingTerminos || isPublicando}
        >
          <FiSave /> Publicar Nueva Versión
        </button>
      </div>

      <div className={styles.editorWorkspace}>
        {/* Barra Lateral de Selección de Documentos */}
        <div className={styles.docSelectSidebar}>
          <h3 className={styles.sideTitle}>Documentos Disponibles</h3>
          <div className={styles.docsList}>
            <button type="button" className={`${styles.docCardBtn} ${styles.activeDoc}`} disabled>
              <FiFileText className={styles.docIcon} />
              <div className={styles.docMeta}>
                <span className={styles.docName}>{TITULO_TERMINOS}</span>
                <span className={styles.docVers}>
                  Versión actual: {terminosVigentes?.terminosycondicionesid ?? "—"}
                </span>
              </div>
            </button>
          </div>

          <div className={styles.infoCardNote}>
            <h4>
              <FiAlertTriangle /> Notificación a Socios
            </h4>
            <p>
              Cada publicación queda registrada como una versión nueva e irreversible — no
              hay forma de deshacer una publicación, solo publicar otra encima.
            </p>
          </div>
        </div>

        {/* Panel Central de Edición */}
        <div className={styles.mainEditorPanel}>
          {isLoadingTerminos ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
              <Spinner size={36} />
            </div>
          ) : (
            <>
              <div className={styles.editorHead}>
                <div className={styles.headLeft}>
                  <h2>{TITULO_TERMINOS}</h2>
                  <span className={styles.versionBadge}>
                    {terminosVigentes?.terminosycondicionesid
                      ? `v${terminosVigentes.terminosycondicionesid}`
                      : "Sin publicar"}
                  </span>
                  <span className={styles.timestampInfo}>
                    <FiClock /> Última actualización: {formatearMomento(terminosVigentes?.momento)}
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
            </>
          )}
        </div>
      </div>

      <ConfirmacionModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmSave}
        titulo="Publicar Nueva Versión"
        mensaje={`¿Estás seguro de que deseas publicar una nueva versión de "${TITULO_TERMINOS}"? Esto requerirá que todos los usuarios vuelvan a aceptar los términos y condiciones en su próximo inicio de sesión.`}
        variant="blue"
        confirmText="PUBLICAR"
        cancelText="CANCELAR"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
        isLoading={isPublicando}
      />
    </div>
  );
}
