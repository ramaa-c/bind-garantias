import React, { useState } from "react";
import {
  FiPlus,
  FiEdit2,
  FiSearch,
  FiInbox,
  FiAlertCircle,
  FiCheck,
  FiRotateCcw,
} from "react-icons/fi";
import { toast } from "sonner";
import { Button, Skeleton } from "../../../components/ui";
import { TipoDocumentoArchivoModal } from "../../../components/features/admin/TipoDocumentoArchivoModal/TipoDocumentoArchivoModal";
import { CadenaSelectCard } from "../../../components/features/admin/CadenaSelectCard/CadenaSelectCard";
import { ConfirmacionModal } from "../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import {
  useTiposDocumentoArchivoActivos,
  useDocumentMetadata,
} from "../../../hooks/useTipoDocumentoArchivo";
import { useObtenerTodasWebConEstado } from "../../../hooks/useCadenaValor";
import { useRequisitos } from "../../../hooks/useRequisitos";
import { useBloqueoAdminRestringido } from "../../../hooks/useBloqueoAdminRestringido";
import { TABS_TIPO_PERSONA } from "../../../utils/relacionesTercerosUtils";
import { DOCUMENTOS_REQUISITOS } from "../../../constants/documentosRequisitos";
import { mensajeNegocio } from "../../../utils/mensajesError";
import styles from "./TiposDocumentoArchivo.module.css";

const FilaSkeleton = () => (
  <div className={styles.catalogoFila}>
    <Skeleton width="2.2rem" height="1.2rem" radius="0.35rem" />
    <Skeleton width="55%" height="0.85rem" />
  </div>
);

const OPCIONES_TRIPLE = [
  {
    valor: 0,
    texto: "No mostrar",
    clase: "opcionNo",
    ayuda: "No se mostrará esta carga en el legajo del cliente",
  },
  {
    valor: 2,
    texto: "Opcional",
    clase: "opcionOpcional",
    ayuda:
      "Se mostrará la carga pero el cliente puede continuar sin adjuntarlo",
  },
  {
    valor: 1,
    texto: "Obligatorio",
    clase: "opcionObligatorio",
    ayuda: "El cliente debe subir obligatoriamente el documento para finalizar",
  },
];

const CLAVES_DOCUMENTOS = DOCUMENTOS_REQUISITOS.map(({ key }) => key);

const contarCambios = (actual, guardado) => {
  if (!actual || !guardado) return 0;
  return Object.keys(actual).reduce((total, tipo) => {
    const a = actual[tipo]?.documentos || {};
    const g = guardado[tipo]?.documentos || {};
    return (
      total +
      CLAVES_DOCUMENTOS.filter((k) => (a[k] ?? 0) !== (g[k] ?? 0)).length
    );
  }, 0);
};

export default function TiposDocumentoArchivo() {
  const { bloqueado, verificando } = useBloqueoAdminRestringido();
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [itemEditar, setItemEditar] = useState(null);

  const {
    data: activosConsultados,
    isLoading: cargandoActivos,
    isError,
  } = useTiposDocumentoArchivoActivos();
  const activosData = verificando ? undefined : activosConsultados;
  const cargando = cargandoActivos || verificando;
  const activos = Array.isArray(activosData)
    ? activosData
    : activosData?.items || activosData?.data || [];

  const [cadenaId, setCadenaId] = useState("");
  const [tabActiva, setTabActiva] = useState("sa");
  const [configLocal, setConfigLocal] = useState(null);
  const [requisitosSincronizados, setRequisitosSincronizados] = useState(null);
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);

  const { data: cadenasConsultadas, isLoading: cargandoCadenasApi } =
    useObtenerTodasWebConEstado();
  const cadenasData = verificando ? undefined : cadenasConsultadas;
  const cargandoCadenas = cargandoCadenasApi || verificando;
  const cadenas = Array.isArray(cadenasData)
    ? cadenasData
    : cadenasData?.items || cadenasData?.data || [];

  const { tituloDe, estaHabilitado } = useDocumentMetadata();

  const {
    requisitos,
    updateRequisitos,
    isUpdating,
    isLoading: cargandoRequisitos,
  } = useRequisitos(cadenaId);

  if (
    cadenaId &&
    requisitos &&
    !cargandoRequisitos &&
    requisitos !== requisitosSincronizados
  ) {
    setRequisitosSincronizados(requisitos);
    setConfigLocal(JSON.parse(JSON.stringify(requisitos)));
  }

  const seleccionarCadena = (valor) => {
    setCadenaId(String(valor));
    setConfigLocal(null);
    setRequisitosSincronizados(null);
  };

  const sinCambios =
    !!requisitos &&
    !!configLocal &&
    contarCambios(configLocal, requisitos) === 0;

  const actualizarDocumento = (clave, valor) => {
    setConfigLocal((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [tabActiva]: {
          ...prev[tabActiva],
          documentos: { ...prev[tabActiva].documentos, [clave]: valor },
        },
      };
    });
  };

  const aplicarATodos = (valor) => {
    setConfigLocal((prev) => {
      if (!prev) return prev;
      const actualizado = { ...prev[tabActiva].documentos };
      clavesVisibles.forEach((clave) => {
        actualizado[clave] = valor;
      });
      return {
        ...prev,
        [tabActiva]: { ...prev[tabActiva], documentos: actualizado },
      };
    });
  };

  const restablecer = () => {
    if (!requisitos) return;
    setConfigLocal(JSON.parse(JSON.stringify(requisitos)));
    toast.success("Configuración restablecida a la última guardada");
  };

  const confirmarGuardar = () => {
    updateRequisitos(configLocal, {
      onSuccess: () => {
        toast.success("Configuración de documentos guardada correctamente");
        setConfirmacionAbierta(false);
      },
      onError: (error) => {
        toast.error("Ocurrió un error al guardar la configuración", {
          description: mensajeNegocio(error, ""),
        });
        setConfirmacionAbierta(false);
      },
    });
  };

  const activosNormalizados = activos
    .map((item) => ({
      tipodocumentoarchivoid:
        item.tipodocumentoarchivoid ?? item.TipoDocumentoArchivoID,
      descripcion: item.descripcion ?? item.Descripcion ?? "",
    }))
    .filter(
      (item) =>
        item.tipodocumentoarchivoid !== undefined &&
        item.tipodocumentoarchivoid !== null,
    );

  const documentos = isError
    ? []
    : DOCUMENTOS_REQUISITOS.filter(({ key }) => estaHabilitado(key)).map(
        (doc) => ({ ...doc, title: tituloDe(doc.key) || doc.key }),
      );
  const clavesVisibles = documentos.map(({ key }) => key);

  const listaFiltrada = activosNormalizados.filter((item) => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return true;
    return (
      item.descripcion.toLowerCase().includes(termino) ||
      String(item.tipodocumentoarchivoid).includes(termino)
    );
  });

  const abrirAlta = () => {
    setItemEditar(null);
    setModalAbierto(true);
  };

  const abrirEdicion = (item) => {
    setItemEditar(item);
    setModalAbierto(true);
  };

  if (bloqueado) return null;

  const cantidadCambios = contarCambios(configLocal, requisitos);
  const valoresTab = clavesVisibles.map(
    (clave) => configLocal?.[tabActiva]?.documentos?.[clave] ?? 0,
  );
  const valorComun =
    valoresTab.length > 0 && valoresTab.every((v) => v === valoresTab[0])
      ? valoresTab[0]
      : null;

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

  const renderCatalogo = () => {
    if (cargando)
      return Array.from({ length: 6 }).map((_, i) => <FilaSkeleton key={i} />);
    if (isError) {
      return (
        <div className={styles.vacio}>
          <FiAlertCircle aria-hidden="true" />
          <span>
            No pudimos cargar los documentos habilitados. Probá de nuevo en un
            rato.
          </span>
        </div>
      );
    }
    if (listaFiltrada.length === 0) {
      return (
        <div className={styles.vacio}>
          <FiInbox aria-hidden="true" />
          <span>
            {activosNormalizados.length === 0
              ? "Todavía no hay documentos habilitados para la web."
              : "Ningún documento coincide con la búsqueda."}
          </span>
        </div>
      );
    }
    return listaFiltrada.map((item) => (
      <div key={item.tipodocumentoarchivoid} className={styles.catalogoFila}>
        <span className={styles.idTag}>#{item.tipodocumentoarchivoid}</span>
        <span className={styles.catalogoNombre} title={item.descripcion}>
          {item.descripcion || "-"}
        </span>
        <button
          type="button"
          className={styles.editBtn}
          onClick={() => abrirEdicion(item)}
          title="Editar nombre"
          aria-label={`Editar ${item.descripcion}`}
        >
          <FiEdit2 size={13} aria-hidden="true" /> Editar
        </button>
      </div>
    ));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tipos de documento</h1>
      </div>

      <div className={styles.layout}>
        <section className={styles.panel} aria-label="Catálogo de documentos">
          <div className={styles.panelCabecera}>
            <h2>Catálogo de documentos</h2>
            {!cargando && !isError && (
              <span className={styles.contador}>
                {activosNormalizados.length}
              </span>
            )}
            <Button
              type="button"
              variant="adminSuave"
              size="sm"
              onClick={abrirAlta}
              className={styles.btnNueva}
            >
              <FiPlus aria-hidden="true" /> Nuevo
            </Button>
          </div>

          <div className={styles.buscador}>
            <FiSearch className={styles.buscadorIcono} aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar por nombre o ID"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar documento por nombre o ID"
            />
          </div>

          <div className={styles.catalogo}>{renderCatalogo()}</div>

          <p className={styles.panelNota}>
            El ID es el del catálogo real de SGR+ y no cambia: acá solo se
            define qué documentos están disponibles para la web y el nombre que
            ve el cliente.
          </p>
        </section>

        <section
          className={styles.panel}
          aria-label="Parametrización por cadena"
        >
          <div className={styles.panelCabecera}>
            <h2>Parametrización por cadena</h2>
            <div className={styles.selectorCadena}>
              {cargandoCadenas ? (
                <Skeleton height="3rem" width="100%" radius="0.75rem" />
              ) : (
                <CadenaSelectCard
                  options={cadenas}
                  value={cadenaId}
                  onChange={seleccionarCadena}
                  placeholder="Elegí una cadena de valor"
                  compacta
                />
              )}
            </div>
          </div>

          {!cadenaId ? (
            <div className={styles.vacio}>
              <FiInbox aria-hidden="true" />
              <span>
                Elegí una cadena para definir qué documentos pide en el legajo,
                según el tipo de persona.
              </span>
            </div>
          ) : cargandoRequisitos || !configLocal ? (
            <div className={styles.paramCuerpo}>
              <Skeleton height="2.25rem" width="100%" radius="0.6rem" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={i}
                  height="3.25rem"
                  width="100%"
                  radius="0.6rem"
                />
              ))}
            </div>
          ) : (
            <>
              <div className={styles.paramControles}>
                <span className={styles.rotulo}>Tipo de persona</span>
                <div
                  className={styles.tipos}
                  role="tablist"
                  aria-label="Tipo de persona"
                >
                  {TABS_TIPO_PERSONA.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={tabActiva === tab.id}
                      className={`${styles.tipo} ${tabActiva === tab.id ? styles.tipoActivo : ""}`}
                      onClick={() => setTabActiva(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className={styles.aplicarTodos}>
                  <span className={styles.rotulo}>Aplicar a todos</span>
                  {controlTriple(valorComun, aplicarATodos, "Aplicar a todos")}
                </div>
              </div>

              <div className={styles.paramCuerpo}>
                {documentos.length === 0 ? (
                  <div className={styles.vacio}>
                    <FiInbox aria-hidden="true" />
                    <span>
                      {cargando
                        ? "Cargando los documentos habilitados..."
                        : "No hay documentos habilitados. Habilitalos en el catálogo para poder parametrizarlos."}
                    </span>
                  </div>
                ) : (
                  <div className={styles.relaciones}>
                    {documentos.map(({ key, title, desc }) => (
                      <div key={key} className={styles.relacion}>
                        <div className={styles.relacionTextos}>
                          <strong>{title}</strong>
                          <span>{desc}</span>
                        </div>
                        {controlTriple(
                          configLocal[tabActiva]?.documentos?.[key] ?? 0,
                          (valor) => actualizarDocumento(key, valor),
                          title,
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.paramPie}>
                <span
                  className={`${styles.pieEstado} ${cantidadCambios > 0 ? styles.pieEstadoCambios : ""}`}
                >
                  {cantidadCambios > 0 ? (
                    <>
                      <FiAlertCircle aria-hidden="true" />
                      {cantidadCambios} cambio{cantidadCambios !== 1 ? "s" : ""}{" "}
                      sin guardar
                    </>
                  ) : (
                    "Sin cambios"
                  )}
                </span>
                <Button
                  variant="adminNeutro"
                  onClick={restablecer}
                  disabled={isUpdating || sinCambios}
                  title={
                    sinCambios ? "No hay cambios para restablecer" : undefined
                  }
                >
                  <FiRotateCcw aria-hidden="true" /> Restablecer
                </Button>
                <Button
                  variant="blue"
                  onClick={() => setConfirmacionAbierta(true)}
                  isLoading={isUpdating}
                  disabled={isUpdating || sinCambios}
                  title={sinCambios ? "No hay cambios para guardar" : undefined}
                >
                  <FiCheck aria-hidden="true" /> Guardar
                </Button>
              </div>
            </>
          )}
        </section>
      </div>

      <ConfirmacionModal
        isOpen={confirmacionAbierta}
        onClose={() => setConfirmacionAbierta(false)}
        onConfirm={confirmarGuardar}
        titulo="Guardar configuración"
        mensaje="¿Estás seguro de que deseás guardar la nueva parametrización de documentos (para todos los tipos de persona/sociedad) en esta cadena de valor?"
        variant="blue"
        confirmText="Guardar"
        cancelText="Cancelar"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
        isLoading={isUpdating}
      />

      <TipoDocumentoArchivoModal
        key={`${itemEditar?.tipodocumentoarchivoid ?? "nuevo"}-${modalAbierto ? "open" : "closed"}`}
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        itemEditar={itemEditar}
        idsActivos={activosNormalizados.map(
          (item) => item.tipodocumentoarchivoid,
        )}
      />
    </div>
  );
}
