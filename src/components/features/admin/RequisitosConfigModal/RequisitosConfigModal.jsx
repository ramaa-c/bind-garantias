import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import { CadenaHeaderCard } from "../CadenaHeaderCard/CadenaHeaderCard";
import { useRequisitos } from "../../../../hooks/useRequisitos";
import { FiSave, FiHelpCircle, FiRotateCcw, FiUser, FiBriefcase } from "react-icons/fi";
import { ConfirmacionModal } from "../../shared/ConfirmacionModal/ConfirmacionModal";
import styles from "./RequisitosConfigModal.module.css";

const DOCUMENT_METADATA = [
  { key: "estatuto", title: "Estatuto Social", desc: "Normas constitutivas de la entidad legal." },
  { key: "eecc", title: "Estados Contables (EECC)", desc: "Estados contables auditados de los últimos ejercicios." },
  { key: "balance", title: "Balance de Sumas y Saldos", desc: "Estado de sumas y saldos firmado por contador público." },
  { key: "ddjjIva", title: "Declaración Jurada de IVA", desc: "Últimas declaraciones juradas de IVA presentadas." },
  { key: "poderes", title: "Poderes", desc: "Copia de representación legal para firmantes." },
  { key: "certificadoPyme", title: "Certificado PyME", desc: "Certificado oficial emitido por el Ministerio de Producción / AFIP." },
  { key: "actaDesignacion", title: "Acta de Designación de Autoridades", desc: "Acta de designación de autoridades vigente." },
  { key: "actaSocios", title: "Acta de Reunión de Socios", desc: "Acta de última reunión de socios o asamblea de la sociedad." },
  { key: "f1272", title: "Formulario F1272", desc: "Formulario de declaración de PyME ante la AFIP." },
  { key: "ddjjGanancias", title: "DDJJ de Ganancias", desc: "Última declaración jurada de Ganancias presentada (Física)." },
  { key: "manifestacionBienes", title: "Manifestación de Bienes", desc: "Manifestación de bienes o DDJJ de Bienes Personales (Física)." },
  { key: "constanciaMonotributo", title: "Constancia de Monotributo", desc: "Constancia de opción al Monotributo de AFIP (Física)." },
  { key: "cartasDocumento", title: "Cartas Documento", desc: "Cartas documento operativas relacionadas." },
  { key: "otrosDocumentos", title: "Otros Documentos", desc: "Cualquier otra documentación de respaldo del legajo." }
];

const RELATION_METADATA = [
  { key: "accionistas", title: "Composición Accionaria", desc: "Declaración del cuadro accionario y participaciones societarias (Socio/Fiador)." },
  { key: "representantes", title: "Representantes Legales", desc: "Administración de representantes legales y apoderados habilitados." },
  { key: "agentesBolsa", title: "Agentes de Bolsa", desc: "Vinculación y administración de cuentas comitentes con agentes de bolsa." },
  { key: "usuarios", title: "Vincular Usuarios", desc: "Autorización y otorgamiento de accesos a otros usuarios en la plataforma." }
];

const TABS = [
  { id: "fisica", label: "Física", icon: FiUser },
  { id: "sa", label: "S.A.", icon: FiBriefcase },
  { id: "srl", label: "S.R.L.", icon: FiBriefcase },
  { id: "sh", label: "S.H.", icon: FiBriefcase },
  { id: "otras", label: "Otras", icon: FiBriefcase },
];

export const RequisitosConfigModal = ({ isOpen, onClose, activeItem }) => {
  const cadenaId = activeItem?.cadenavalorid;
  const { requisitos, updateRequisitos, isUpdating, refetch } = useRequisitos(cadenaId);

  // Solapa activa actual
  const [activeTab, setActiveTab] = useState("sa");
  // Estado local de configuraciones agrupadas
  const [localConfig, setLocalConfig] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Refetch fresh data when modal opens
  useEffect(() => {
    if (isOpen && cadenaId) {
      refetch();
    }
  }, [isOpen, cadenaId, refetch]);

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
        [activeTab]: {
          ...prev[activeTab],
          [type]: {
            ...prev[activeTab][type],
            [key]: value
          }
        }
      };
    });
  };

  const handleReset = () => {
    if (requisitos) {
      setLocalConfig(JSON.parse(JSON.stringify(requisitos)));
      const activeLabel = TABS.find(t => t.id === activeTab)?.label || "Solapa";
      toast.success(`Configuración de ${activeLabel} restablecida a la última guardada`);
    }
  };

  const handleSave = () => {
    if (!cadenaId || !localConfig) return;
    setConfirmOpen(true);
  };

  const confirmSave = () => {
    updateRequisitos(localConfig, {
      onSuccess: () => {
        toast.success("Configuración de requisitos guardada correctamente");
        setConfirmOpen(false);
        onClose();
      },
      onError: (error) => {
        console.error(error);
        toast.error("Ocurrió un error al guardar los requisitos");
        setConfirmOpen(false);
      }
    });
  };

  if (!isOpen || !localConfig) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PARAMETRIZACIÓN DE REQUISITOS"
      maxWidth="750px"
      variant="blue"
      headerActions={
        <button
          type="button"
          className={styles.helpButton}
          onClick={() => toast.info("Configurá de forma independiente los requisitos para Persona Física y los diferentes tipos societarios de Persona Jurídica.")}
          title="Ayuda"
        >
          <FiHelpCircle size={20} />
        </button>
      }
    >
      {/* Solapas de selección de perfil */}
      <div className={styles.tabContainer}>
        {TABS.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <IconComponent style={{ marginRight: "0.4rem" }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className={styles.modalBody}>
        <CadenaHeaderCard
          denominacion={activeItem?.denominacion}
          logo={activeItem?.logo}
          referencia={activeItem?.referencia}
          cadenavalorid={activeItem?.cadenavalorid}
          cuittercero={activeItem?.cuittercero}
        />

        <p className={styles.introText}>
          Configurá cómo se solicitarán los requisitos para el alta de operaciones y legajos en la zona de usuarios para{" "}
          <strong>{TABS.find(t => t.id === activeTab)?.label}</strong>:
        </p>

        {/* SECTION 1: DOCUMENTACION */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Documentación Requerida</h3>
          <div className={styles.list}>
            {DOCUMENT_METADATA.map(({ key, title, desc }) => {
              const val = localConfig[activeTab]?.documentos?.[key] !== undefined
                ? localConfig[activeTab].documentos[key]
                : 0;

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
              const val = localConfig[activeTab]?.relaciones?.[key] !== undefined
                ? localConfig[activeTab].relaciones[key]
                : 0;

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
        <Button variant="outlineBlue" size="sm" onClick={handleReset} disabled={isUpdating}>
          <FiRotateCcw style={{ marginRight: "0.5rem" }} />
          REESTABLECER
        </Button>
        <Button variant="blue" size="sm" onClick={handleSave} className={styles.saveBtn} isLoading={isUpdating} disabled={isUpdating}>
          <FiSave style={{ marginRight: "0.5rem" }} />
          GUARDAR CONFIGURACIÓN
        </Button>
      </div>

      <ConfirmacionModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmSave}
        titulo="Guardar Configuración"
        mensaje="¿Estás seguro de que deseas guardar la nueva parametrización de requisitos (para todos los tipos de personas/sociedades) en esta cadena de valor?"
        variant="blue"
        confirmText="GUARDAR"
        cancelText="CANCELAR"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
        isLoading={isUpdating}
      />
    </Modal>
  );
};
