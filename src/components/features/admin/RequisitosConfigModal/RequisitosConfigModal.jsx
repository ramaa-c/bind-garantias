import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import { CadenaHeaderCard } from "../CadenaHeaderCard/CadenaHeaderCard";
import { useRequisitos } from "../../../../hooks/useRequisitos";
import { useRelationMetadata } from "../../../../hooks/useTipoRelacionSocio";
import {
  TABS_TIPO_PERSONA,
  esRelacionVisible,
} from "../../../../utils/relacionesTercerosUtils";
import { FiSave, FiHelpCircle, FiRotateCcw, FiList } from "react-icons/fi";
import { ConfirmacionModal } from "../../shared/ConfirmacionModal/ConfirmacionModal";
import styles from "./RequisitosConfigModal.module.css";
import { mensajeNegocio } from "../../../../utils/mensajesError";

const DOCUMENT_METADATA = [
  { key: "estatuto", title: "Estatuto Social", desc: "Normas constitutivas de la entidad legal." },
  { key: "eecc", title: "Estados Contables (EECC)", desc: "Estados contables auditados de los últimos ejercicios." },
  { key: "balance", title: "Balance de Sumas y Saldos", desc: "Estado de sumas y saldos firmado por contador público." },
  { key: "ddjjIva", title: "Declaración Jurada de IVA", desc: "Últimas declaraciones juradas de IVA presentadas." },
  { key: "poderes", title: "Poderes", desc: "Copia de representación legal para firmantes." },
  { key: "certificadoPyme", title: "Certificado PyME", desc: "Certificado oficial emitido por el Ministerio de Producción / ARCA." },
  { key: "actaDesignacion", title: "Acta de Designación de Autoridades", desc: "Acta de designación de autoridades vigente." },
  { key: "actaSocios", title: "Acta de Reunión de Socios", desc: "Acta de última reunión de socios o asamblea de la sociedad." },
  { key: "f1272", title: "Formulario F1272", desc: "Formulario de declaración de PyME ante la ARCA." },
  { key: "ddjjGanancias", title: "DDJJ de Ganancias", desc: "Última declaración jurada de Ganancias presentada (Física)." },
  { key: "manifestacionBienes", title: "Manifestación de Bienes", desc: "Manifestación de bienes o DDJJ de Bienes Personales (Física)." },
  { key: "constanciaMonotributo", title: "Constancia de Monotributo", desc: "Constancia de opción al Monotributo de ARCA (Física)." },
  { key: "cartasDocumento", title: "Cartas Documento", desc: "Cartas documento operativas relacionadas." },
  { key: "otrosDocumentos", title: "Otros Documentos", desc: "Cualquier otra documentación de respaldo del legajo." }
];

const TABS = TABS_TIPO_PERSONA;

export const RequisitosConfigModal = ({ isOpen, onClose, activeItem }) => {
  const cadenaId = activeItem?.cadenavalorid;
  const { requisitos, updateRequisitos, isUpdating, refetch } = useRequisitos(cadenaId);

  // Fuente de verdad para qué relaciones se pueden parametrizar y cómo se
  // llaman: lo que el admin activó en /admin/tipos-relacion-socio (ver
  // Compartida con la mini parametrización de
  // terceros en TiposRelacionSocio.jsx - ver useRelationMetadata.
  const { relationMetadata } = useRelationMetadata();

  // Solapa activa actual
  const [activeTab, setActiveTab] = useState("sa");
  const [seccion, setSeccion] = useState("documentos");
  // Estado local de configuraciones agrupadas: arranca como copia de lo que
  // haya en caché al montar (el padre remonta este modal en cada apertura,
  // ver key en CadenasValor.jsx) y se resincroniza durante el render cuando
  // el refetch de abajo trae datos más frescos.
  const [localConfig, setLocalConfig] = useState(() =>
    requisitos ? JSON.parse(JSON.stringify(requisitos)) : null
  );
  const [requisitosSincronizados, setRequisitosSincronizados] = useState(requisitos);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (requisitos && requisitos !== requisitosSincronizados) {
    setRequisitosSincronizados(requisitos);
    setLocalConfig(JSON.parse(JSON.stringify(requisitos)));
  }

  // Refetch fresh data when modal opens
  useEffect(() => {
    if (isOpen && cadenaId) {
      refetch();
    }
  }, [isOpen, cadenaId, refetch]);

  // localConfig arranca como copia exacta de requisitos (lo último guardado)
  // y solo se aparta de eso vía handleUpdate/handleReset: comparar contra
  // requisitos alcanza para saber si el usuario cambió algo de verdad antes
  // de disparar el ConfirmacionModal de guardado.
  const sinCambios =
    !!requisitos && !!localConfig && JSON.stringify(localConfig) === JSON.stringify(requisitos);

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

  const handleSetTodos = (type, value) => {
    setLocalConfig(prev => {
      if (!prev) return prev;
      const metadata = type === "documentos" ? DOCUMENT_METADATA : relationMetadata;
      const claves = metadata
        .map(({ key }) => key)
        .filter((key) => type === "documentos" || esRelacionVisible(key, activeTab));
      const actualizado = { ...prev[activeTab][type] };
      claves.forEach((key) => {
        actualizado[key] = value;
      });
      return {
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          [type]: actualizado,
        },
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
        toast.error("Ocurrió un error al guardar los requisitos", { description: mensajeNegocio(error, "") });
        setConfirmOpen(false);
      }
    });
  };

  if (!isOpen || !localConfig) return null;

  const ESTADOS = [
    { valor: 0, texto: "No mostrar", clase: styles.activeNone },
    { valor: 2, texto: "Opcional", clase: styles.activeOptional },
    { valor: 1, texto: "Obligatorio", clase: styles.activeRequired },
  ];

  const AYUDAS = {
    documentos: {
      0: "No se mostrará esta carga en el legajo del cliente",
      2: "Se mostrará la carga pero el cliente puede continuar sin adjuntarlo",
      1: "El cliente debe subir obligatoriamente el documento para finalizar",
    },
    relaciones: {
      0: "Se ocultará esta pestaña/paso completamente",
      2: "Se mostrará pero el cliente puede no declarar registros",
      1: "El cliente debe obligatoriamente declarar al menos un registro para continuar",
    },
  };

  const filasDe = (tipo) =>
    tipo === "documentos"
      ? DOCUMENT_METADATA
      : relationMetadata.filter(
          ({ key }) => !(activeTab === "fisica" && (key === "accionistas" || key === "representanteLegal")),
        );

  const valorDe = (tipo, key) => localConfig?.[activeTab]?.[tipo]?.[key] ?? 0;

  const filas = filasDe(seccion);
  const valores = filas.map(({ key }) => valorDe(seccion, key));
  const valorComun = valores.length > 0 && valores.every((v) => v === valores[0]) ? valores[0] : null;
  const cantidad = (valor) => valores.filter((v) => v === valor).length;

  const controlTriple = (valorActual, onElegir, ayudas, etiqueta) => (
    <div className={styles.segmentedControl} role="radiogroup" aria-label={etiqueta}>
      {ESTADOS.map(({ valor, texto, clase }) => (
        <button
          key={valor}
          type="button"
          role="radio"
          aria-checked={valorActual === valor}
          className={`${styles.segmentBtn} ${valorActual === valor ? clase : ""}`}
          onClick={() => onElegir(valor)}
          title={ayudas?.[valor]}
        >
          {texto}
        </button>
      ))}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Requisitos de la cadena"
      subtitle="Qué se le pide al cliente en el alta, según el tipo de persona."
      icono={<FiList />}
      maxWidth="860px"
      variant="blue"
      preventClose={isUpdating}
      headerActions={
        <button
          type="button"
          className={styles.helpButton}
          onClick={() => toast.info("Configurá de forma independiente los requisitos para Persona Física y los diferentes tipos societarios de Persona Jurídica.")}
          title="Ayuda"
          aria-label="Ayuda"
        >
          <FiHelpCircle size={17} />
        </button>
      }
      footer={
        <>
          <Button
            variant="adminNeutro"
            onClick={handleReset}
            disabled={isUpdating || sinCambios}
            title={sinCambios ? "No hay cambios para restablecer" : undefined}
          >
            <FiRotateCcw aria-hidden="true" />
            Restablecer
          </Button>
          <Button
            variant="blue"
            onClick={handleSave}
            isLoading={isUpdating}
            disabled={isUpdating || sinCambios}
            title={sinCambios ? "No hay cambios para guardar" : undefined}
          >
            <FiSave aria-hidden="true" />
            Guardar
          </Button>
        </>
      }
    >
      <div className={styles.modalBody}>
        <div className={styles.cabecera}>
          <CadenaHeaderCard
            compacta
            denominacion={activeItem?.denominacion}
            logo={activeItem?.logo}
            referencia={activeItem?.referencia}
            cadenavalorid={activeItem?.cadenavalorid}
            cuittercero={activeItem?.cuittercero}
          />
          <div className={styles.tipoPersona}>
            <span className={styles.tipoPersonaEtiqueta}>Tipo de persona</span>
            <div className={styles.tipos} role="tablist" aria-label="Tipo de persona">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.solapas} role="tablist">
          {[
            ["documentos", "Documentación"],
            ["relaciones", "Relaciones y secciones"],
          ].map(([id, texto]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={seccion === id}
              className={`${styles.solapa} ${seccion === id ? styles.solapaActiva : ""}`}
              onClick={() => setSeccion(id)}
            >
              {texto}
              <span className={styles.solapaContador}>{filasDe(id).length}</span>
            </button>
          ))}
        </div>

        <div className={styles.todos}>
          <span className={styles.todosTexto}>Aplicar a todos</span>
          {controlTriple(valorComun, (valor) => handleSetTodos(seccion, valor), AYUDAS[seccion], "Aplicar a todos")}
        </div>

        <div className={styles.list}>
          {filas.map(({ key, title, desc }) => (
            <div key={key} className={styles.row}>
              <div className={styles.info}>
                <strong className={styles.rowTitle}>{title}</strong>
                <span className={styles.rowDesc}>{desc}</span>
              </div>
              {controlTriple(valorDe(seccion, key), (valor) => handleUpdate(seccion, key, valor), AYUDAS[seccion], title)}
            </div>
          ))}
        </div>

        <div className={styles.resumen}>
          <span><i className={styles.puntoObligatorio} />{cantidad(1)} obligatorios</span>
          <span><i className={styles.puntoOpcional} />{cantidad(2)} opcionales</span>
          <span><i className={styles.puntoOculto} />{cantidad(0)} ocultos</span>
        </div>
      </div>

      <ConfirmacionModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmSave}
        titulo="Guardar configuración"
        mensaje="¿Estás seguro de que deseas guardar la nueva parametrización de requisitos (para todos los tipos de personas/sociedades) en esta cadena de valor?"
        variant="blue"
        confirmText="Guardar"
        cancelText="Cancelar"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
        isLoading={isUpdating}
      />
    </Modal>
  );
};
