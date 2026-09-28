import React, { useState } from "react";
import { FiPlus, FiEdit2, FiSearch, FiInbox, FiSave, FiRotateCcw } from "react-icons/fi";
import { toast } from "sonner";
import { Button, InfoTooltip, Skeleton } from "../../../components/ui";
import { TipoRelacionSocioModal } from "../../../components/features/admin/TipoRelacionSocioModal/TipoRelacionSocioModal";
import { CadenaSelectCard } from "../../../components/features/admin/CadenaSelectCard/CadenaSelectCard";
import { ConfirmacionModal } from "../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { useTiposRelacionSocioActivos, useRelationMetadata } from "../../../hooks/useTipoRelacionSocio";
import { useObtenerTodasWebConEstado } from "../../../hooks/useCadenaValor";
import { useRequisitos } from "../../../hooks/useRequisitos";
import { TABS_TIPO_PERSONA, esRelacionVisible } from "../../../utils/relacionesTercerosUtils";
import { useBloqueoAdminRestringido } from "../../../hooks/useBloqueoAdminRestringido";
import styles from "./TiposRelacionSocio.module.css";

const RowSkeleton = () => (
  <tr>
    <td><Skeleton width="30%" height="0.85rem" /></td>
    <td><Skeleton width="60%" height="0.9rem" /></td>
    <td style={{ textAlign: "center" }}>
      <Skeleton width="28px" height="28px" radius="0.4rem" style={{ margin: "0 auto" }} />
    </td>
  </tr>
);

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
        toast.error("Ocurrió un error al guardar la configuración");
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <h1>Relaciones de Terceros</h1>
          <p>
            Activá los vínculos del catálogo real de SGR+ que se pueden usar
            en la web, con la descripción que va a ver el cliente.
          </p>
        </div>
        <div className={styles.actionsTop}>
          <InfoTooltip
            variant="admin"
            label="¿Cómo funciona el ID?"
            texto="El ID siempre es el del catálogo real de SGR+ - acá solo se define cómo se llama esa relación para la web. Una vez activada, no se puede desactivar."
          />
          <Button type="button" variant="blue" size="lg" onClick={handleAgregar}>
            <FiPlus /> Agregar relación
          </Button>
        </div>
      </div>

      <div className={styles.contentRow}>
        <div className={styles.listColumn}>
          <div className={styles.filtersCard}>
            <div className={styles.searchWrap}>
              <FiSearch className={styles.iconSearch} />
              <input
                type="text"
                placeholder="Buscar por descripción o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {!isLoading && (
              <span className={styles.listCount}>
                {listaFiltrada.length} relación{listaFiltrada.length !== 1 ? "es" : ""}
              </span>
            )}
          </div>

          <div className={styles.tableCard}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: "5.5rem" }}>ID</th>
                    <th>Descripción (web)</th>
                    <th style={{ textAlign: "center", width: "4.5rem" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)
                  ) : listaFiltrada.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: 0 }}>
                        <div className={styles.emptyState}>
                          <FiInbox className={styles.emptyStateIcon} />
                          <span>Todavía no hay relaciones activadas para la web.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    listaFiltrada.map((item) => (
                      <tr key={item.tiporelacionsocioid}>
                        <td>
                          <span className={styles.idTag}>#{item.tiporelacionsocioid}</span>
                        </td>
                        <td>{item.descripcion || "-"}</td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className={styles.editBtn}
                            onClick={() => handleEditar(item)}
                            title="Editar descripción"
                          >
                            <FiEdit2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={styles.paramCard}>
          <div className={styles.paramHeader}>
            <h2>Parametrización por cadena</h2>
            <p>
              Elegí una cadena de valor para definir cómo se piden estas
              relaciones en su legajo, por tipo de persona/sociedad.
            </p>
          </div>

          {isLoadingCadenas ? (
            <Skeleton height="82px" width="100%" radius="0.75rem" />
          ) : (
            <CadenaSelectCard
              options={cadenasWeb}
              value={selectedCadenaId}
              onChange={handleSeleccionarCadena}
              placeholder="Seleccionar cadena de valor..."
            />
          )}

          {!selectedCadenaId ? (
            <div className={styles.emptySelection}>
              Seleccioná una cadena de valor para configurar cómo pide sus
              relaciones de terceros.
            </div>
          ) : isLoadingRequisitos || !localConfig ? (
            <div className={styles.paramSkeleton}>
              <Skeleton height="2.75rem" width="100%" radius="0.75rem" />
              <Skeleton height="3.5rem" width="100%" radius="0.625rem" />
              <Skeleton height="3.5rem" width="100%" radius="0.625rem" />
              <Skeleton height="3.5rem" width="100%" radius="0.625rem" />
            </div>
          ) : (
            <>
              <div className={styles.tabContainer}>
                {TABS_TIPO_PERSONA.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={`${styles.tabBtn} ${activeParamTab === tab.id ? styles.tabActive : ""}`}
                      onClick={() => setActiveParamTab(tab.id)}
                    >
                      <Icon style={{ marginRight: "0.4rem" }} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className={styles.paramListHeader}>
                <span className={styles.listCount}>
                  Configurando para{" "}
                  <strong>
                    {TABS_TIPO_PERSONA.find((t) => t.id === activeParamTab)?.label}
                  </strong>
                </span>
                <div className={styles.bulkActions}>
                  <button
                    type="button"
                    className={`${styles.bulkBtn} ${styles.bulkBtnNone}`}
                    onClick={() => handleSetTodosParam(0)}
                  >
                    Todo No mostrar
                  </button>
                  <button
                    type="button"
                    className={`${styles.bulkBtn} ${styles.bulkBtnOptional}`}
                    onClick={() => handleSetTodosParam(2)}
                  >
                    Todo Opcional
                  </button>
                  <button
                    type="button"
                    className={`${styles.bulkBtn} ${styles.bulkBtnRequired}`}
                    onClick={() => handleSetTodosParam(1)}
                  >
                    Todo Obligatorio
                  </button>
                </div>
              </div>

              <div className={styles.paramList}>
                {relationMetadata.map(({ key, title, desc }) => {
                  if (!esRelacionVisible(key, activeParamTab)) return null;

                  const val =
                    localConfig[activeParamTab]?.relaciones?.[key] !== undefined
                      ? localConfig[activeParamTab].relaciones[key]
                      : 0;

                  return (
                    <div key={key} className={styles.paramRow}>
                      <div className={styles.paramInfo}>
                        <strong>{title}</strong>
                        <span>{desc}</span>
                      </div>
                      <div className={styles.segmentedControl}>
                        <button
                          type="button"
                          className={`${styles.segmentBtn} ${val === 0 ? styles.activeNone : ""}`}
                          onClick={() => handleUpdateParam(key, 0)}
                          title="Se ocultará esta pestaña/paso completamente"
                        >
                          No mostrar
                        </button>
                        <button
                          type="button"
                          className={`${styles.segmentBtn} ${val === 2 ? styles.activeOptional : ""}`}
                          onClick={() => handleUpdateParam(key, 2)}
                          title="Se mostrará pero el cliente puede no declarar registros"
                        >
                          Opcional
                        </button>
                        <button
                          type="button"
                          className={`${styles.segmentBtn} ${val === 1 ? styles.activeRequired : ""}`}
                          onClick={() => handleUpdateParam(key, 1)}
                          title="El cliente debe obligatoriamente declarar al menos un registro para continuar"
                        >
                          Obligatorio
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.paramFooter}>
                <Button
                  variant="outlineBlue"
                  size="sm"
                  onClick={handleResetParam}
                  disabled={isUpdating || sinCambiosParam}
                  title={sinCambiosParam ? "No hay cambios para restablecer" : undefined}
                >
                  <FiRotateCcw style={{ marginRight: "0.5rem" }} />
                  Reestablecer
                </Button>
                <Button
                  variant="blue"
                  size="sm"
                  onClick={handleGuardarParam}
                  isLoading={isUpdating}
                  disabled={isUpdating || sinCambiosParam}
                  title={sinCambiosParam ? "No hay cambios para guardar" : undefined}
                >
                  <FiSave style={{ marginRight: "0.5rem" }} />
                  Guardar configuración
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmacionModal
        isOpen={confirmParamOpen}
        onClose={() => setConfirmParamOpen(false)}
        onConfirm={confirmarGuardarParam}
        titulo="Guardar configuración"
        mensaje="¿Estás seguro de que deseás guardar la nueva parametrización de terceros (para todos los tipos de persona/sociedad) en esta cadena de valor?"
        variant="blue"
        confirmText="GUARDAR"
        cancelText="CANCELAR"
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
