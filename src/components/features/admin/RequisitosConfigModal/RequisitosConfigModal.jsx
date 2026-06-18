import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import { CadenaHeaderCard } from "../CadenaHeaderCard/CadenaHeaderCard";
import { useRequisitos } from "../../../../hooks/useRequisitos";
import { FiSave, FiX, FiSliders, FiHelpCircle, FiRotateCcw } from "react-icons/fi";
import { ConfirmacionModal } from "../../shared/ConfirmacionModal/ConfirmacionModal";
import styles from "./RequisitosConfigModal.module.css";

const DOCUMENT_METADATA = [
  { key: "estatuto", title: "Estatuto Social", desc: "Normas constitutivas de la entidad legal." },
  { key: "balance", title: "Último Balance", desc: "Último balance de la empresa firmado por contador público." },
  { key: "acta", title: "Acta de Autoridades / DDJJ IVA", desc: "Designación de autoridades vigente o declaración jurada equivalente." },
  { key: "poderes", title: "Poderes", desc: "Copia de representación legal para firmantes." },
  { key: "certificadoPyme", title: "Certificado PyME", desc: "Certificado oficial emitido por el Ministerio de Producción / AFIP." },
  { key: "cartasDocumento", title: "Cartas Documento", desc: "Cartas documento operativas relacionadas." },
  { key: "otrosDocumentos", title: "Otros Documentos", desc: "Cualquier otra documentación de respaldo del legajo." }
];

const RELATION_METADATA = [
  { key: "accionistas", title: "Composición Accionaria", desc: "Declaración del cuadro accionario y participaciones societarias (Socio/Fiador)." },
  { key: "representantes", title: "Representantes Legales", desc: "Administración de representantes legales y apoderados habilitados." },
  { key: "agentesBolsa", title: "Agentes de Bolsa", desc: "Vinculación y administración de cuentas comitentes con agentes de bolsa." },
  { key: "usuarios", title: "Vincular Usuarios", desc: "Autorización y otorgamiento de accesos a otros usuarios en la plataforma." }
];

export const RequisitosConfigModal = ({ isOpen, onClose, activeItem }) => {
  const cadenaId = activeItem?.cadenavalorid;
  const { requisitos, updateRequisitos } = useRequisitos(cadenaId);

  // Estado local para poder editar y guardar al hacer clic en "Guardar"
  const [localConfig, setLocalConfig] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (requisitos) {
      setLocalConfig(JSON.parse(JSON.stringify(requisitos)));
    }
  }, [requisitos, isOpen]);

  const handleUpdate = (type, key, value) => {
    setLocalConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [type]: {
          ...prev[type],
          [key]: value
        }
      };
    });
  };

  const handleReset = () => {
    if (requisitos) {
      setLocalConfig(JSON.parse(JSON.stringify(requisitos)));
      toast.success("Configuración restablecida a la última guardada");
    }
  };

  const handleSave = () => {
    if (!cadenaId || !localConfig) return;
    setConfirmOpen(true);
  };

  const confirmSave = () => {
    try {
      updateRequisitos(localConfig);
      toast.success("Configuración de requisitos guardada correctamente");
      setConfirmOpen(false);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al guardar los requisitos");
    }
  };

  if (!isOpen || !localConfig) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PARAMETRIZACIÓN DE REQUISITOS"
      maxWidth="700px"
      variant="blue"
      headerActions={
        <button
          type="button"
          className={styles.helpButton}
          onClick={() => toast.info("Configurá la visibilidad y obligatoriedad de la documentación y relaciones para los usuarios de esta cadena.")}
          title="Ayuda"
        >
          <FiHelpCircle size={20} />
        </button>
      }
    >
      <div className={styles.modalBody}>
        <CadenaHeaderCard
          denominacion={activeItem?.denominacion}
          logo={activeItem?.logo}
          referencia={activeItem?.referencia}
          cadenavalorid={activeItem?.cadenavalorid}
          cuittercero={activeItem?.cuittercero}
        />

        <p className={styles.introText}>
          Configurá cómo se solicitarán los requisitos para el alta de operaciones y legajos en la zona de usuarios:
        </p>

        {/* SECTION 1: DOCUMENTACION */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Documentación Requerida</h3>
          <div className={styles.list}>
            {DOCUMENT_METADATA.map(({ key, title, desc }) => {
              const val = localConfig.documentos[key] !== undefined ? localConfig.documentos[key] : 2;
              return (
                <div key={key} className={styles.row}>
                  <div className={styles.info}>
                    <strong className={styles.rowTitle}>{title}</strong>
                    <span className={styles.rowDesc}>{desc}</span>
                  </div>
                  <div className={styles.segmentedControl}>
                    <button
                      type="button"
                      className={`${styles.segmentBtn} ${val === 0 ? styles.activeNone : ""}`}
                      onClick={() => handleUpdate("documentos", key, 0)}
                      title="No se mostrará esta carga en el legajo del cliente"
                    >
                      No mostrar
                    </button>
                    <button
                      type="button"
                      className={`${styles.segmentBtn} ${val === 2 ? styles.activeOptional : ""}`}
                      onClick={() => handleUpdate("documentos", key, 2)}
                      title="Se mostrará la carga pero el cliente puede continuar sin adjuntarlo"
                    >
                      Opcional
                    </button>
                    <button
                      type="button"
                      className={`${styles.segmentBtn} ${val === 1 ? styles.activeRequired : ""}`}
                      onClick={() => handleUpdate("documentos", key, 1)}
                      title="El cliente debe subir obligatoriamente el documento para finalizar"
                    >
                      Obligatorio
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: RELACIONES */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Relaciones y Secciones</h3>
          <div className={styles.list}>
            {RELATION_METADATA.map(({ key, title, desc }) => {
              const val = localConfig.relaciones[key] !== undefined ? localConfig.relaciones[key] : 2;
              return (
                <div key={key} className={styles.row}>
                  <div className={styles.info}>
                    <strong className={styles.rowTitle}>{title}</strong>
                    <span className={styles.rowDesc}>{desc}</span>
                  </div>
                  <div className={styles.segmentedControl}>
                    <button
                      type="button"
                      className={`${styles.segmentBtn} ${val === 0 ? styles.activeNone : ""}`}
                      onClick={() => handleUpdate("relaciones", key, 0)}
                      title="Se ocultará esta pestaña/paso completamente"
                    >
                      No mostrar
                    </button>
                    <button
                      type="button"
                      className={`${styles.segmentBtn} ${val === 2 ? styles.activeOptional : ""}`}
                      onClick={() => handleUpdate("relaciones", key, 2)}
                      title="Se mostrará pero el cliente puede no declarar registros"
                    >
                      Opcional
                    </button>
                    <button
                      type="button"
                      className={`${styles.segmentBtn} ${val === 1 ? styles.activeRequired : ""}`}
                      onClick={() => handleUpdate("relaciones", key, 1)}
                      title="El cliente debe obligatoriamente declarar al menos un registro para continuar"
                    >
                      Obligatorio
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.modalFooter}>
        <Button variant="outlineBlue" size="sm" onClick={handleReset}>
          <FiRotateCcw style={{ marginRight: "0.5rem" }} />
          REESTABLECER
        </Button>
        <Button variant="blue" size="sm" onClick={handleSave} className={styles.saveBtn}>
          <FiSave style={{ marginRight: "0.5rem" }} />
          GUARDAR CONFIGURACIÓN
        </Button>
      </div>

      <ConfirmacionModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmSave}
        titulo="Guardar Configuración"
        mensaje="¿Estás seguro de que deseas guardar la nueva parametrización de requisitos para esta cadena de valor?"
        variant="blue"
        confirmText="GUARDAR"
        cancelText="CANCELAR"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
      />
    </Modal>
  );
};





