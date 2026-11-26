import React, { useMemo, useState } from "react";
import { FiFileText, FiAlertCircle, FiInbox, FiRotateCcw, FiCheck } from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import { Skeleton } from "../../../ui";
import { useTiposDocumentoArchivoActivos } from "../../../../hooks/useTipoDocumentoArchivo";
import { IDS_DOCUMENTO_SIEMPRE_ACTIVOS } from "../../../../constants/tiposDocumentoArchivo";
import styles from "./DocumentosTerceroModal.module.css";

const OPCIONES_TRIPLE = [
  { valor: 0, texto: "No mostrar", clase: "opcionNo", ayuda: "No se le pide este documento al tercero" },
  { valor: 2, texto: "Opcional", clase: "opcionOpcional", ayuda: "Se muestra la carga pero el cliente puede no adjuntarlo" },
  { valor: 1, texto: "Obligatorio", clase: "opcionObligatorio", ayuda: "El cliente debe adjuntarlo para cada tercero de este tipo" },
];

const ordenDocumento = (id) => {
  const posicion = IDS_DOCUMENTO_SIEMPRE_ACTIVOS.indexOf(id);
  return posicion === -1 ? IDS_DOCUMENTO_SIEMPRE_ACTIVOS.length + id : posicion;
};

const contarCambios = (actual, guardado) =>
  Object.keys({ ...actual, ...guardado }).filter((id) => (actual[id] ?? 0) !== (guardado[id] ?? 0)).length;

export const DocumentosTerceroModal = ({ isOpen, onClose, tercero, configuracionGuardada = {} }) => {
  const { data: activosData, isLoading, isError } = useTiposDocumentoArchivoActivos();
  const [config, setConfig] = useState(() => ({ ...configuracionGuardada }));

  const documentos = useMemo(() => {
    const lista = Array.isArray(activosData) ? activosData : activosData?.list || [];
    return lista
      .map((item) => ({
        id: Number(item?.tipodocumentoarchivoid),
        descripcion: String(item?.descripcion || "").trim(),
      }))
      .filter((item) => item.id)
      .sort((a, b) => ordenDocumento(a.id) - ordenDocumento(b.id));
  }, [activosData]);

  const valores = documentos.map(({ id }) => config[id] ?? 0);
  const valorComun = valores.length > 0 && valores.every((v) => v === valores[0]) ? valores[0] : null;
  const cantidadCambios = contarCambios(config, configuracionGuardada);
  const cantidadPedidos = valores.filter((v) => v !== 0).length;

  const elegir = (id, valor) => setConfig((prev) => ({ ...prev, [id]: valor }));

  const aplicarATodos = (valor) =>
    setConfig((prev) => {
      const actualizado = { ...prev };
      documentos.forEach(({ id }) => {
        actualizado[id] = valor;
      });
      return actualizado;
    });

  const controlTriple = (valor, onElegir, etiqueta) => (
    <div className={styles.triple} role="radiogroup" aria-label={etiqueta}>
      {OPCIONES_TRIPLE.map((opcion) => (
        <button
          key={opcion.valor}
          type="button"
          role="radio"
          aria-checked={valor === opcion.valor}
          className={`${styles.opcion} ${valor === opcion.valor ? styles[opcion.clase] : ""}`}
          onClick={() => onElegir(opcion.valor)}
          title={opcion.ayuda}
        >
          {opcion.texto}
        </button>
      ))}
    </div>
  );

  const renderCuerpo = () => {
    if (isLoading) {
      return (
        <div className={styles.lista}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.fila}>
              <Skeleton width="45%" height="0.9rem" />
              <Skeleton width="15rem" height="1.9rem" radius="0.5rem" />
            </div>
          ))}
        </div>
      );
    }
    if (isError) {
      return (
        <div className={styles.vacio}>
          <FiAlertCircle aria-hidden="true" />
          <span>No pudimos cargar los documentos activados. Probá de nuevo en un rato.</span>
        </div>
      );
    }
    if (documentos.length === 0) {
      return (
        <div className={styles.vacio}>
          <FiInbox aria-hidden="true" />
          <span>No hay documentos activados. Activalos en Tipos de Documento para poder pedirlos.</span>
        </div>
      );
    }
    return (
      <div className={styles.lista}>
        {documentos.map(({ id, descripcion }) => (
          <div key={id} className={styles.fila}>
            <div className={styles.filaTextos}>
              <span className={styles.idTag}>#{id}</span>
              <strong title={descripcion}>{descripcion || "-"}</strong>
            </div>
            {controlTriple(config[id] ?? 0, (valor) => elegir(id, valor), descripcion)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Documentos de ${tercero?.descripcion || "tercero"}`}
      subtitle="Qué documentos se le piden a cada tercero de este tipo en el legajo. Vale para todas las cadenas de valor."
      icono={<FiFileText />}
      maxWidth="680px"
      variant="blue"
      footer={
        <div className={styles.pie}>
          <span className={`${styles.pieEstado} ${cantidadCambios > 0 ? styles.pieEstadoCambios : ""}`}>
            {cantidadCambios > 0 ? (
              <>
                <FiAlertCircle aria-hidden="true" />
                {cantidadCambios} cambio{cantidadCambios !== 1 ? "s" : ""} sin guardar
              </>
            ) : (
              `${cantidadPedidos} de ${documentos.length} documentos pedidos`
            )}
          </span>
          <Button
            variant="adminNeutro"
            onClick={() => setConfig({ ...configuracionGuardada })}
            disabled={cantidadCambios === 0}
          >
            <FiRotateCcw aria-hidden="true" /> Restablecer
          </Button>
          <Button variant="blue" disabled title="Se habilita cuando esté disponible la API">
            <FiCheck aria-hidden="true" /> Guardar
          </Button>
        </div>
      }
    >
      {!isLoading && !isError && documentos.length > 0 && (
        <div className={styles.controles}>
          <span className={styles.rotulo}>Aplicar a todos</span>
          {controlTriple(valorComun, aplicarATodos, "Aplicar a todos")}
        </div>
      )}
      {renderCuerpo()}
    </Modal>
  );
};

export default DocumentosTerceroModal;
