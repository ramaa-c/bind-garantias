import React, { useMemo, useState } from "react";
import { FiFileText, FiAlertCircle, FiInbox, FiRotateCcw, FiCheck } from "react-icons/fi";
import { toast } from "sonner";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import { Skeleton } from "../../../ui";
import { ConfirmacionModal } from "../../shared/ConfirmacionModal/ConfirmacionModal";
import { useTiposDocumentoArchivoActivos } from "../../../../hooks/useTipoDocumentoArchivo";
import { useDocumentosPorRelacion, useGuardarDocumentosDeRelacion } from "../../../../hooks/useDocumentosPorRelacion";
import { esAdminGeneralToken } from "../../../../api/tokenApi";
import { IDS_DOCUMENTO_SIEMPRE_ACTIVOS } from "../../../../constants/tiposDocumentoArchivo";
import { mensajeNegocio } from "../../../../utils/mensajesError";
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

const SIN_CONFIGURACION = {};

export const DocumentosTerceroModal = ({ isOpen, onClose, tercero }) => {
  const tipoRelacionSocioId = Number(tercero?.tiporelacionsocioid);
  const { data: activosData, isLoading: cargandoActivos, isError: errorActivos } = useTiposDocumentoArchivoActivos();
  const {
    configuracion,
    isLoading: cargandoConfiguracion,
    isError: errorConfiguracion,
  } = useDocumentosPorRelacion();
  const { mutate: guardar, isPending: guardando } = useGuardarDocumentosDeRelacion();
  const soloLectura = !esAdminGeneralToken();

  const guardado = errorConfiguracion ? SIN_CONFIGURACION : configuracion[tipoRelacionSocioId] || SIN_CONFIGURACION;
  const [config, setConfig] = useState(null);
  const [guardadoSincronizado, setGuardadoSincronizado] = useState(null);
  const [confirmarAbierto, setConfirmarAbierto] = useState(false);
  if (!cargandoConfiguracion && guardado !== guardadoSincronizado) {
    setGuardadoSincronizado(guardado);
    setConfig({ ...guardado });
  }

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

  const isLoading = cargandoActivos || cargandoConfiguracion || !config;
  const valorDe = (id) => config?.[id] ?? 0;
  const guardadoDe = (id) => guardado[id] ?? 0;
  const cambios = documentos.filter(({ id }) => valorDe(id) !== guardadoDe(id));
  const valores = documentos.map(({ id }) => valorDe(id));
  const valorComun = valores.length > 0 && valores.every((v) => v === valores[0]) ? valores[0] : null;
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

  const confirmarGuardado = () => {
    const valoresAGuardar = Object.fromEntries(cambios.map(({ id }) => [id, valorDe(id)]));
    guardar(
      { tipoRelacionSocioId, valores: valoresAGuardar },
      {
        onSuccess: () => {
          toast.success(`Documentos de ${tercero?.descripcion || "la relación"} guardados`);
          setConfirmarAbierto(false);
        },
        onError: (error) => {
          toast.error("No se pudieron guardar los documentos", {
            description: mensajeNegocio(error, "Revisá la configuración y volvé a intentar."),
          });
          setConfirmarAbierto(false);
        },
      },
    );
  };

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
          disabled={soloLectura || guardando}
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
    if (errorActivos || errorConfiguracion) {
      return (
        <div className={styles.vacio}>
          <FiAlertCircle aria-hidden="true" />
          <span>
            {errorConfiguracion
              ? "No pudimos cargar los documentos configurados para esta relación. Probá de nuevo en un rato."
              : "No pudimos cargar los documentos activados. Probá de nuevo en un rato."}
          </span>
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
            {controlTriple(valorDe(id), (valor) => elegir(id, valor), descripcion)}
          </div>
        ))}
      </div>
    );
  };

  const hayError = errorActivos || errorConfiguracion;
  const cantidadCambios = cambios.length;

  return (
    <>
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
              {soloLectura ? (
                "Solo un administrador puede cambiar esta configuración"
              ) : cantidadCambios > 0 ? (
                <>
                  <FiAlertCircle aria-hidden="true" />
                  {cantidadCambios} cambio{cantidadCambios !== 1 ? "s" : ""} sin guardar
                </>
              ) : (
                `${cantidadPedidos} de ${documentos.length} documentos pedidos`
              )}
            </span>
            {!soloLectura && (
              <>
                <Button
                  variant="adminNeutro"
                  onClick={() => setConfig({ ...guardado })}
                  disabled={cantidadCambios === 0 || guardando}
                >
                  <FiRotateCcw aria-hidden="true" /> Restablecer
                </Button>
                <Button
                  variant="blue"
                  onClick={() => setConfirmarAbierto(true)}
                  isLoading={guardando}
                  disabled={cantidadCambios === 0 || guardando || isLoading || hayError}
                >
                  <FiCheck aria-hidden="true" /> Guardar
                </Button>
              </>
            )}
          </div>
        }
      >
        {!isLoading && !hayError && documentos.length > 0 && !soloLectura && (
          <div className={styles.controles}>
            <span className={styles.rotulo}>Aplicar a todos</span>
            {controlTriple(valorComun, aplicarATodos, "Aplicar a todos")}
          </div>
        )}
        {renderCuerpo()}
      </Modal>

      <ConfirmacionModal
        isOpen={confirmarAbierto}
        onClose={() => setConfirmarAbierto(false)}
        onConfirm={confirmarGuardado}
        titulo="Guardar documentos"
        mensaje={`Los cambios se aplican a todos los legajos en todas las cadenas de valor: a partir de ahora se le van a pedir estos documentos a cada ${tercero?.descripcion || "tercero"}. ¿Querés guardarlos?`}
        variant="blue"
        confirmText="Guardar"
        cancelText="Cancelar"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
        isLoading={guardando}
      />
    </>
  );
};

export default DocumentosTerceroModal;
