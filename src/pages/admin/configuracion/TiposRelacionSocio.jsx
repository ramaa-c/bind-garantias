import React, { useState } from "react";
import { FiPlus, FiEdit2, FiSearch, FiInbox, FiCheck, FiRotateCcw, FiAlertCircle } from "react-icons/fi";
import { toast } from "sonner";
import { Button, Skeleton } from "../../../components/ui";
import { TipoRelacionSocioModal } from "../../../components/features/admin/TipoRelacionSocioModal/TipoRelacionSocioModal";
import { CadenaSelectCard } from "../../../components/features/admin/CadenaSelectCard/CadenaSelectCard";
import { ConfirmacionModal } from "../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { useTiposRelacionSocioActivos, useRelationMetadata } from "../../../hooks/useTipoRelacionSocio";
import { useObtenerTodasWebConEstado } from "../../../hooks/useCadenaValor";
import { useRequisitos } from "../../../hooks/useRequisitos";
import { TABS_TIPO_PERSONA, esRelacionVisible } from "../../../utils/relacionesTercerosUtils";
import { useBloqueoAdminRestringido } from "../../../hooks/useBloqueoAdminRestringido";
import styles from "./TiposRelacionSocio.module.css";
import { mensajeNegocio } from "../../../utils/mensajesError";

const RowSkeleton = () => (
  <div className={styles.catalogoFila}>
    <Skeleton width="2.2rem" height="1.2rem" radius="0.35rem" />
    <Skeleton width="55%" height="0.85rem" />
  </div>
);

const OPCIONES_TRIPLE = [
  { valor: 0, texto: "No mostrar", clase: "opcionNo", ayuda: "Se ocultará esta pestaña/paso completamente" },
  { valor: 2, texto: "Opcional", clase: "opcionOpcional", ayuda: "Se mostrará pero el cliente puede no declarar registros" },
  { valor: 1, texto: "Obligatorio", clase: "opcionObligatorio", ayuda: "El cliente debe declarar al menos un registro para continuar" },
];

const contarCambios = (actual, guardado) => {
  if (!actual || !guardado) return 0;
  return Object.keys(actual).reduce((total, tipo) => {
    const a = actual[tipo]?.relaciones || {};
    const g = guardado[tipo]?.relaciones || {};
    return total + Object.keys({ ...a, ...g }).filter((k) => (a[k] ?? 0) !== (g[k] ?? 0)).length;
  }, 0);
};

// ABM del catálogo curado de relaciones de terceros (api/TipoRelacionSocio),
// que reemplaza el TipoRelacionSocioID hardcodeado que hoy vive repartido en
// varios lugares del código (ver requisitosService.js/TIPO_RELACION_MAP). El
// alta/edición vive en TipoRelacionSocioModal - acá solo el listado.
export default function TiposRelacionSocio() {
  // Defensa en profundidad: ver useBloqueoAdminRestringido.
  const bloqueado = useBloqueoAdminRestringido();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [itemEditar, setItemEditar] = useState(null);

  const { data: activosData, isLoading } = useTiposRelacionSocioActivos();
  const activos = Array.isArray(activosData)
    ? activosData
    : activosData?.items || activosData?.data || [];

  // Mini parametrización de terceros por cadena (mismo dato que edita
  // RequisitosConfigModal, sección "Relaciones y Secciones" - ver
  // useRelationMetadata) - un atajo para no tener que ir a Cadenas de
  // Valor y abrir el modal completo solo para tocar terceros.
  const [selectedCadenaId, setSelectedCadenaId] = useState("");
  const [activeParamTab, setActiveParamTab] = useState("sa");
  const [localConfig, setLocalConfig] = useState(null);
  const [requisitosSincronizados, setRequisitosSincronizados] = useState(null);
  const [confirmParamOpen, setConfirmParamOpen] = useState(false);

  const { data: cadenasWebData, isLoading: isLoadingCadenas } =
    useObtenerTodasWebConEstado();
  const cadenasWeb = Array.isArray(cadenasWebData)
    ? cadenasWebData
    : cadenasWebData?.items || cadenasWebData?.data || [];

  const { relationMetadata } = useRelationMetadata();
  const {
    requisitos,
    updateRequisitos,
    isUpdating,
    isLoading: isLoadingRequisitos,
  } = useRequisitos(selectedCadenaId);

  // Se espera a que termine de cargar (isLoadingRequisitos) antes de copiar
  // requisitos a localConfig: mientras carga, el hook ya devuelve un
  // fallback de valores por defecto (ver useRequisitos.js) que no es el de
  // esta cadena - sincronizar antes de tiempo hacía que, al cambiar de
  // cadena, se vieran por un instante los valores por defecto en vez de los
  // reales, quedando la sensación de que se habían perdido cambios guardados.
  if (
    selectedCadenaId &&
    requisitos &&
    !isLoadingRequisitos &&
    requisitos !== requisitosSincronizados
  ) {
    setRequisitosSincronizados(requisitos);
    setLocalConfig(JSON.parse(JSON.stringify(requisitos)));
  }

  // Al cambiar de cadena se limpia localConfig de una: si no, mientras
  // carga la nueva, se seguían viendo en pantalla las filas de la cadena
  // anterior (con sus valores) como si ya fueran las de la nueva selección.
  const handleSeleccionarCadena = (val) => {
    setSelectedCadenaId(String(val));
    setLocalConfig(null);
    setRequisitosSincronizados(null);
  };

  const sinCambiosParam =
    !!requisitos &&
    !!localConfig &&
    JSON.stringify(localConfig) === JSON.stringify(requisitos);

  const handleUpdateParam = (key, value) => {
    setLocalConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [activeParamTab]: {
          ...prev[activeParamTab],
          relaciones: {
            ...prev[activeParamTab].relaciones,
            [key]: value,
          },
        },
      };
    });
  };

  const handleSetTodosParam = (value) => {
    setLocalConfig((prev) => {
      if (!prev) return prev;
      const claves = relationMetadata
        .map(({ key }) => key)
        .filter((key) => esRelacionVisible(key, activeParamTab));
      const actualizado = { ...prev[activeParamTab].relaciones };
      claves.forEach((key) => {
        actualizado[key] = value;
      });
      return {
        ...prev,
        [activeParamTab]: {
          ...prev[activeParamTab],
          relaciones: actualizado,
        },
      };
    });
  };

  const handleResetParam = () => {
    if (requisitos) {
      setLocalConfig(JSON.parse(JSON.stringify(requisitos)));
      toast.success("Configuración restablecida a la última guardada");
    }
  };

  const handleGuardarParam = () => {
    if (!selectedCadenaId || !localConfig) return;
    setConfirmParamOpen(true);
  };

  const confirmarGuardarParam = () => {
    updateRequisitos(localConfig, {
      onSuccess: () => {
        toast.success("Configuración de terceros guardada correctamente");
        setConfirmParamOpen(false);
      },
      onError: (error) => {
        console.error(error);
        toast.error("Ocurrió un error al guardar la configuración", { description: mensajeNegocio(error, "") });
        setConfirmParamOpen(false);
      },
    });
  };

  const activosNormalizados = activos.map((item) => ({
    tiporelacionsocioid: item.tiporelacionsocioid ?? item.TipoRelacionSocioID,
    descripcion: item.descripcion ?? item.Descripcion ?? "",
  }));

  const listaFiltrada = activosNormalizados.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.descripcion.toLowerCase().includes(term) ||
      String(item.tiporelacionsocioid).includes(term)
    );
  });

  const handleAgregar = () => {
    setItemEditar(null);
    setModalAbierto(true);
  };

  const handleEditar = (item) => {
    setItemEditar(item);
    setModalAbierto(true);
  };

  if (bloqueado) return null;

  const cantidadCambios = contarCambios(localConfig, requisitos);

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

  const clavesVisibles = relationMetadata
    .map(({ key }) => key)
    .filter((key) => esRelacionVisible(key, activeParamTab));
  const valoresTab = clavesVisibles.map((key) => localConfig?.[activeParamTab]?.relaciones?.[key] ?? 0);
  const valorComun = valoresTab.length > 0 && valoresTab.every((v) => v === valoresTab[0]) ? valoresTab[0] : null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Relaciones de terceros</h1>
      </div>

      <div className={styles.layout}>
        <section className={styles.panel} aria-label="Catálogo de relaciones">
          <div className={styles.panelCabecera}>
            <h2>Catálogo de relaciones</h2>
            {!isLoading && <span className={styles.contador}>{activosNormalizados.length}</span>}
            <Button type="button" variant="adminSuave" size="sm" onClick={handleAgregar} className={styles.btnNueva}>
              <FiPlus aria-hidden="true" /> Nueva
            </Button>
          </div>

          <div className={styles.buscador}>
            <FiSearch className={styles.buscadorIcono} aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar por descripción o ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar relación por descripción o ID"
            />
          </div>

          <div className={styles.catalogo}>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
            ) : listaFiltrada.length === 0 ? (
              <div className={styles.vacio}>
                <FiInbox aria-hidden="true" />
                <span>
                  {activosNormalizados.length === 0
                    ? "Todavía no hay relaciones activadas para la web."
                    : "Ninguna relación coincide con la búsqueda."}
                </span>
              </div>
            ) : (
              listaFiltrada.map((item) => (
                <div key={item.tiporelacionsocioid} className={styles.catalogoFila}>
                  <span className={styles.idTag}>#{item.tiporelacionsocioid}</span>
                  <span className={styles.catalogoNombre} title={item.descripcion}>
                    {item.descripcion || "-"}
                  </span>
                  <button
                    type="button"
                    className={styles.editBtn}
                    onClick={() => handleEditar(item)}
                    title="Editar descripción"
                    aria-label={`Editar ${item.descripcion}`}
                  >
                    <FiEdit2 size={13} aria-hidden="true" /> Editar
                  </button>
                </div>
              ))
            )}
          </div>

          <p className={styles.panelNota}>
            El ID es el del catálogo real de SGR+ y no cambia: acá solo se define el nombre que ve el cliente. Una vez activada, una relación no se puede desactivar.
          </p>
        </section>

        <section className={styles.panel} aria-label="Parametrización por cadena">
          <div className={styles.panelCabecera}>
            <h2>Parametrización por cadena</h2>
            <div className={styles.selectorCadena}>
              {isLoadingCadenas ? (
                <Skeleton height="3rem" width="100%" radius="0.75rem" />
              ) : (
                <CadenaSelectCard
                  options={cadenasWeb}
                  value={selectedCadenaId}
                  onChange={handleSeleccionarCadena}
                  placeholder="Elegí una cadena de valor"
                  compacta
                />
              )}
            </div>
          </div>

          {!selectedCadenaId ? (
            <div className={styles.vacio}>
              <FiInbox aria-hidden="true" />
              <span>Elegí una cadena para definir qué relaciones pide en el legajo, según el tipo de persona.</span>
            </div>
          ) : isLoadingRequisitos || !localConfig ? (
            <div className={styles.paramCuerpo}>
              <Skeleton height="2.25rem" width="100%" radius="0.6rem" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} height="3.25rem" width="100%" radius="0.6rem" />
              ))}
            </div>
          ) : (
            <>
              <div className={styles.paramControles}>
                <span className={styles.rotulo}>Tipo de persona</span>
                <div className={styles.tipos} role="tablist" aria-label="Tipo de persona">
                  {TABS_TIPO_PERSONA.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={activeParamTab === tab.id}
                      className={`${styles.tipo} ${activeParamTab === tab.id ? styles.tipoActivo : ""}`}
                      onClick={() => setActiveParamTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className={styles.aplicarTodos}>
                  <span className={styles.rotulo}>Aplicar a todos</span>
                  {controlTriple(valorComun, handleSetTodosParam, "Aplicar a todos")}
                </div>
              </div>

              <div className={styles.paramCuerpo}>
                <div className={styles.relaciones}>
                  {relationMetadata.map(({ key, title, desc }) => {
                    if (!esRelacionVisible(key, activeParamTab)) return null;
                    const val = localConfig[activeParamTab]?.relaciones?.[key] ?? 0;
                    return (
                      <div key={key} className={styles.relacion}>
                        <div className={styles.relacionTextos}>
                          <strong>{title}</strong>
                          <span>{desc}</span>
                        </div>
                        {controlTriple(val, (v) => handleUpdateParam(key, v), title)}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.paramPie}>
                <span className={`${styles.pieEstado} ${cantidadCambios > 0 ? styles.pieEstadoCambios : ""}`}>
                  {cantidadCambios > 0 ? (
                    <>
                      <FiAlertCircle aria-hidden="true" />
                      {cantidadCambios} cambio{cantidadCambios !== 1 ? "s" : ""} sin guardar
                    </>
                  ) : (
                    "Sin cambios"
                  )}
                </span>
                <Button
                  variant="adminNeutro"
                  onClick={handleResetParam}
                  disabled={isUpdating || sinCambiosParam}
                  title={sinCambiosParam ? "No hay cambios para restablecer" : undefined}
                >
                  <FiRotateCcw aria-hidden="true" /> Restablecer
                </Button>
                <Button
                  variant="blue"
                  onClick={handleGuardarParam}
                  isLoading={isUpdating}
                  disabled={isUpdating || sinCambiosParam}
                  title={sinCambiosParam ? "No hay cambios para guardar" : undefined}
                >
                  <FiCheck aria-hidden="true" /> Guardar
                </Button>
              </div>
            </>
          )}
        </section>
      </div>

      <ConfirmacionModal
        isOpen={confirmParamOpen}
        onClose={() => setConfirmParamOpen(false)}
        onConfirm={confirmarGuardarParam}
        titulo="Guardar configuración"
        mensaje="¿Estás seguro de que deseás guardar la nueva parametrización de terceros (para todos los tipos de persona/sociedad) en esta cadena de valor?"
        variant="blue"
        confirmText="Guardar"
        cancelText="Cancelar"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
        isLoading={isUpdating}
      />

      <TipoRelacionSocioModal
        key={`${itemEditar?.tiporelacionsocioid ?? "nuevo"}-${modalAbierto ? "open" : "closed"}`}
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        itemEditar={itemEditar}
        idsActivos={activosNormalizados.map((item) => item.tiporelacionsocioid)}
      />
    </div>
  );
}
