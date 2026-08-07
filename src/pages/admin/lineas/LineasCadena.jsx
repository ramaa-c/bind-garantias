import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiList,
  FiCreditCard,
  FiFileText,
  FiInfo,
} from "react-icons/fi";
import { toast } from "sonner";

import {
  useObtenerTodasWebConEstado,
  useObtenerUtilizado,
} from "../../../hooks/useCadenaValor";
import { useMonedas, useTiposProducto, useObligaciones } from "../../../hooks/useCatalogos";
import {
  useObtenerLimitesCadenaValor,
  useCrearLimiteCadenaValor,
  useActualizarLimiteCadenaValor,
  useObtenerProductosPorLimite,
} from "../../../hooks/useLinea";
import {
  SelectSimple,
  Modal,
  Button,
  Spinner,
  Skeleton,
  InputSimple,
  SelectFechaSimple,
} from "../../../components/ui";
import { CadenaSelectCard } from "../../../components/features/admin/CadenaSelectCard/CadenaSelectCard";
import styles from "./LineasProductos.module.css";

const MOCK_MONEDAS = [
  { monedaid: 2, simbolo: "u$s" },
  { monedaid: 10, simbolo: "UVAS" },
  { monedaid: 500, simbolo: "Euros" },
  { monedaid: 5000, simbolo: "$ARG" },
];

const diasAFecha = (diasStr) => {
  const dias = parseInt(diasStr, 10);
  if (isNaN(dias)) return "";
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
};

const fechaADias = (fechaStr) => {
  const diffTime = new Date(fechaStr) - new Date();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const limpiarMonto = (val) => {
  if (typeof val !== "string") return val;
  return val.replace(/[^0-9,]/g, "").replace(",", ".");
};

// --- CHILD COMPONENT: SKELETON CARD ---
const LineaSkeletonCard = () => {
  return (
    <div className={styles.lineaCard}>
      <div className={styles.cardHeader}>
        <div className={styles.headerTitleWrapper}>
          <Skeleton height="1rem" width="180px" />
          <Skeleton height="0.75rem" width="100px" />
        </div>
        <div className={styles.headerActions}>
          <Skeleton height="32px" width="32px" radius="0.375rem" />
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <Skeleton height="0.75rem" width="60px" />
            <Skeleton height="1rem" width="120px" />
          </div>
          <div className={styles.detailItem}>
            <Skeleton height="0.75rem" width="70px" />
            <Skeleton height="1rem" width="90px" />
          </div>
          <div className={`${styles.detailItem} ${styles.fullWidthItem}`}>
            <Skeleton height="0.75rem" width="80px" />
            <Skeleton height="1.25rem" width="140px" />
          </div>
        </div>
      </div>

      <div className={styles.cardTogglesBottom}>
        <Skeleton height="1.25rem" width="100px" radius="0.25rem" />
        <Skeleton height="1.25rem" width="150px" radius="0.25rem" />
      </div>
    </div>
  );
};

// --- CHILD COMPONENT: PRODUCTOS VINCULADOS MODAL ---
const ProductosVinculadosModal = ({ isOpen, onClose, tipolimiteid }) => {
  const { data: vinculaciones, isLoading } = useObtenerProductosPorLimite(tipolimiteid);
  const { data: obligaciones, isLoading: isObligacionesLoading } = useObligaciones();

  const listVinculados = vinculaciones || [];
  const opciones = obligaciones?.opciones || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Productos Vinculados"
      variant="blue"
      maxWidth="500px"
    >
      {isLoading || isObligacionesLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "0.6rem" }}>
              <Skeleton width="2rem" height="2rem" radius="0.5rem" />
              <div style={{ flex: 1 }}>
                <Skeleton width="55%" height="0.85rem" />
                <Skeleton width="35%" height="0.7rem" style={{ marginTop: "0.4rem" }} />
              </div>
            </div>
          ))}
        </div>
      ) : listVinculados.length === 0 ? (
        <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-secondary)" }}>
          No hay productos vinculados a esta línea.
        </div>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {listVinculados.map((v) => {
            const obl = opciones.find(
              (o) => String(o.value) === String(v.tipoobligacionid)
            );
            const productoBase = obl ? obl.label : `Producto #${v.tipoobligacionid}`;
            const descripcionCustom = v.descripcion || productoBase;
            
            return (
              <li
                key={v.tipoobligaciontipolimiteid || v.tipoobligacionid || Math.random()}
                style={{
                  padding: "0.75rem",
                  background: "var(--surface-darker, #121212)",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--border-dark, #2a2a2a)",
                  color: "var(--text-primary)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                }}
              >
                <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--blue-light, #a5b4fc)" }}>
                  {descripcionCustom}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  Base: {productoBase}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
        <Button type="button" variant="outlineBlue" onClick={onClose}>
          CERRAR
        </Button>
      </div>
    </Modal>
  );
};


// --- CHILD COMPONENT: LINE CARD ---
const LineaCard = ({
  linea,
  currencies,
  limitTypes,
  onEdit,
  onViewProducts,
  onToggleStatus,
  isToggling,
  isCadenaInactiva,
}) => {
  const monedaLinea = currencies.find(
    (c) => String(c.value) === String(linea.monedalineaid),
  );
  const monedaLineaNombre = monedaLinea
    ? monedaLinea.label
    : `Moneda #${linea.monedalineaid}`;

  const monedaContrato = currencies.find(
    (c) => String(c.value) === String(linea.monedacontratoid),
  );
  const monedaContratoNombre = monedaContrato
    ? monedaContrato.label
    : `Moneda #${linea.monedacontratoid}`;

  let limitTypeDesc = "Desconocida";
  if (limitTypes) {
    const matched = limitTypes.find(
      (m) => String(m.value) === String(linea.tipolimiteid),
    );
    if (matched) limitTypeDesc = matched.label;
  }

  const monedaMock = MOCK_MONEDAS.find(
    (m) => String(m.monedaid) === String(linea.monedalineaid),
  );
  const simboloMoneda = monedaMock ? monedaMock.simbolo : "$";

  const montoDefecto = parseFloat(linea.montodefecto);
  const tieneMontoDefecto = !isNaN(montoDefecto) && montoDefecto > 0;

  return (
    <div 
      className={styles.lineaCard}
      style={isCadenaInactiva ? { opacity: 0.6, filter: "grayscale(100%)" } : {}}
    >
      <div className={styles.cardHeader}>
        <div className={styles.headerTitleWrapper}>
          <h3 className={`${styles.cardTitle} ${styles.cardTitleBlue}`}>
            {linea.descripcion || limitTypeDesc}
          </h3>
          <span className={styles.cardSubtitle}>{limitTypeDesc}</span>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.iconBtnAction} ${styles.btnEdit}`}
            style={isCadenaInactiva ? { opacity: 0.5, cursor: "not-allowed", marginRight: "0.5rem" } : { marginRight: "0.5rem" }}
            title={isCadenaInactiva ? "Cadena inactiva" : "Ver Productos Vinculados"}
            onClick={() => !isCadenaInactiva && onViewProducts(linea)}
            disabled={isCadenaInactiva}
          >
            <FiList />
          </button>
          <button
            type="button"
            className={`${styles.iconBtnAction} ${styles.btnEdit}`}
            style={isCadenaInactiva ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            title={isCadenaInactiva ? "Cadena inactiva" : "Editar Línea"}
            onClick={() => !isCadenaInactiva && onEdit(linea)}
            disabled={isCadenaInactiva}
          >
            <FiEdit />
          </button>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>MONEDA LÍNEA</span>
            <span className={styles.detailValue}>{monedaLineaNombre}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>VIGENCIA LÍNEA</span>
            <span className={styles.detailValue}>
              {linea.diasvigencialinea} días
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>MONEDA CONTRATO</span>
            <span className={styles.detailValue}>{monedaContratoNombre}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>VIGENCIA CONTRATO</span>
            <span className={styles.detailValue}>
              {linea.diasvigenciacontrato} días
            </span>
          </div>
          <div className={`${styles.detailItem} ${styles.fullWidthItem}`}>
            <span className={styles.detailLabel}>MONTO MÁXIMO</span>
            <span className={styles.detailValueHighlight}>
              {simboloMoneda}{" "}
              {parseFloat(linea.montomaximo).toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          {tieneMontoDefecto && (
            <div className={`${styles.detailItem} ${styles.fullWidthItem}`}>
              <span className={styles.detailLabel}>MONTO POR DEFECTO</span>
              <span className={styles.detailValue}>
                {simboloMoneda}{" "}
                {montoDefecto.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}{" "}
                — único monto solicitable
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        className={styles.cardTogglesBottom}
        style={isToggling || isCadenaInactiva ? { opacity: 0.6, pointerEvents: "none" } : {}}
      >
        <label className={styles.cardToggleLabel}>
          <input
            type="checkbox"
            className={styles.cardToggleCheckbox}
            checked={String(linea.activa) === "1"}
            onChange={(e) => onToggleStatus(linea, "activa", e.target.checked)}
            disabled={isToggling || isCadenaInactiva}
          />
          Línea Activa
        </label>
        <label className={styles.cardToggleLabel}>
          <input
            type="checkbox"
            className={styles.cardToggleCheckbox}
            checked={String(linea.aptanuevalinea) === "1"}
            onChange={(e) =>
              onToggleStatus(linea, "aptanuevalinea", e.target.checked)
            }
            disabled={isToggling || isCadenaInactiva}
          />
          Apta Nueva Línea
        </label>
        {isToggling && (
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Spinner size={18} color="#ffffff" />
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function LineasCadena() {
  const [selectedCadenaId, setSelectedCadenaId] = useState("");
  const [isLineaModalOpen, setIsLineaModalOpen] = useState(false);
  const [activeLinea, setActiveLinea] = useState(null);
  const [activeLineaProductosId, setActiveLineaProductosId] = useState(null);
  const [togglingLineas, setTogglingLineas] = useState(new Set());
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    tipolimiteid: "",
    monedaLineaId: "",
    monedaContratoId: "",
    descripcion: "",
    montomaximo: "",
    montoDefecto: "",
    fechaVigenciaLinea: "",
    fechaVigenciaContrato: "",
    aptanuevalinea: true,
    activa: true,
  });

  // Queries
  const { data: cadenas, isLoading: isLoadingCadenas } = useObtenerTodasWebConEstado();
  const { data: lineas, isLoading: isLoadingLineas } =
    useObtenerLimitesCadenaValor(selectedCadenaId);
  const { data: monedas } = useMonedas();
  const { data: limitTypes } = useTiposProducto();
  const { data: utilizadoCadena } = useObtenerUtilizado(selectedCadenaId);

  // Mutations
  const crearMutation = useCrearLimiteCadenaValor();
  const actualizarMutation = useActualizarLimiteCadenaValor();

  const listCadenas = cadenas || [];
  const listLineas = lineas || [];

  const selectedMonedaData = monedas?.raw?.find(
    (m) => String(m.monedaid) === String(formData.monedaLineaId),
  );
  const monedaSimbolo = selectedMonedaData?.simbolo || "$";

  // Techo real de la cadena para el Monto Máximo de una línea nueva: lo que
  // ya se admitió y no se puede volver a comprometer (MontoMaximoCV) y lo que
  // efectivamente queda libre hoy (Disponible = MontoMaximoCV - Utilizado).
  //
  // El campo "Disponible" que devuelve GET CadenaValor/Utilizado/{id} viene
  // mal calculado desde el backend (confirmado: para una cadena con
  // MontoMaximoCV=200M y Utilizado=0 devuelve Disponible=0 en vez de 200M) -
  // se recalcula acá en vez de confiar en ese campo. Reportado a Victor.
  const montoMaximoCV = Number(utilizadoCadena?.montomaximocv) || 0;
  const utilizadoCV = Number(utilizadoCadena?.utilizado) || 0;
  const disponibleCV = Math.max(0, montoMaximoCV - utilizadoCV);
  const pctUsadoCV = montoMaximoCV > 0 ? (utilizadoCV / montoMaximoCV) * 100 : 0;

  const montoMaximoIngresado = parseFloat(limpiarMonto(formData.montomaximo)) || 0;

  const currenciesOptions = monedas?.opciones || [];
  const limitTypesOptions = limitTypes?.opciones || [];

  useEffect(() => {
    if (listCadenas.length > 0 && !selectedCadenaId) {
      setSelectedCadenaId(String(listCadenas[0].cadenavalorid));
    }
  }, [listCadenas, selectedCadenaId]);

  const handleInputChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleToggleStatus = (linea, field, isChecked) => {
    setTogglingLineas((prev) => {
      const next = new Set(prev);
      next.add(linea.tipolimitecadenavalorid);
      return next;
    });

    const payload = {
      ...linea,
      [field]: isChecked ? "1" : "0",
    };

    // Regla de negocio: Si se desactiva/activa la línea, el estado de 'apta' debe coincidir
    if (field === "activa") {
      payload.aptanuevalinea = isChecked ? "1" : "0";
    }

    actualizarMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(`Estado actualizado correctamente`);
      },
      onError: (err) => {
        toast.error("Error al actualizar estado: " + err.message);
      },
      onSettled: () => {
        setTogglingLineas((prev) => {
          const next = new Set(prev);
          next.delete(linea.tipolimitecadenavalorid);
          return next;
        });
      },
    });
  };

  const handleOpenCreateModal = () => {
    setActiveLinea(null);
    setFormErrors({});
    setFormData({
      tipolimiteid: "",
      monedaLineaId: "",
      monedaContratoId: "",
      descripcion: "",
      montomaximo: "",
      montoDefecto: "",
      fechaVigenciaLinea: "",
      fechaVigenciaContrato: "",
      aptanuevalinea: true,
      activa: true,
    });
    setIsLineaModalOpen(true);
  };

  const handleOpenEditModal = (linea) => {
    setActiveLinea(linea);
    setFormErrors({});

    setFormData({
      tipolimiteid: String(linea.tipolimiteid),
      monedaLineaId: String(linea.monedalineaid),
      monedaContratoId: String(linea.monedacontratoid),
      descripcion: linea.descripcion || "",
      montomaximo: String(linea.montomaximo),
      montoDefecto:
        linea.montodefecto && Number(linea.montodefecto) > 0
          ? String(linea.montodefecto)
          : "",
      fechaVigenciaLinea: diasAFecha(linea.diasvigencialinea),
      fechaVigenciaContrato: diasAFecha(linea.diasvigenciacontrato),
      aptanuevalinea: String(linea.aptanuevalinea) === "1",
      activa: String(linea.activa) === "1",
    });
    setIsLineaModalOpen(true);
  };

  // Sin toast genérico: cada campo obligatorio muestra su propio error
  // debajo (mismo patrón que ya usan InputSimple/SelectSimple/SelectFechaSimple),
  // así se ve de un vistazo qué falta en vez de un mensaje flotante que
  // desaparece solo.
  const validarFormulario = () => {
    const errores = {};

    if (!formData.tipolimiteid) errores.tipolimiteid = "Elegí un tipo de línea";
    if (!formData.monedaLineaId) errores.monedaLineaId = "Elegí una moneda";
    if (!formData.monedaContratoId) errores.monedaContratoId = "Elegí una moneda";
    if (!formData.fechaVigenciaLinea) errores.fechaVigenciaLinea = "Elegí una fecha";
    if (!formData.fechaVigenciaContrato) errores.fechaVigenciaContrato = "Elegí una fecha";

    if (!formData.montomaximo || montoMaximoIngresado <= 0) {
      errores.montomaximo = "Ingresá el monto máximo";
    } else if (montoMaximoCV > 0 && montoMaximoIngresado > montoMaximoCV) {
      errores.montomaximo = `Supera el máximo de la cadena (${monedaSimbolo} ${montoMaximoCV.toLocaleString("es-AR")})`;
    }

    return errores;
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();

    const errores = validarFormulario();
    setFormErrors(errores);
    if (Object.keys(errores).length > 0) return;

    const rawMontoMaximo = limpiarMonto(formData.montomaximo);
    const rawMontoDefecto = limpiarMonto(formData.montoDefecto);

    // Techo real de la cadena: si pide más de lo que la cadena admite en
    // total ya se rechazó arriba. Si entra dentro del máximo pero supera lo
    // que hoy queda libre, se acepta topeada al disponible.
    let montoMaximoFinal = parseFloat(rawMontoMaximo);
    if (montoMaximoCV > 0 && montoMaximoFinal > disponibleCV) {
      montoMaximoFinal = disponibleCV;
    }

    const payload = {
      tipolimitecadenavalorid: activeLinea
        ? activeLinea.tipolimitecadenavalorid
        : 0,
      cadenavalorid: Number(selectedCadenaId),
      tipolimiteid: Number(formData.tipolimiteid),
      descripcion: formData.descripcion || "",
      montomaximo: montoMaximoFinal,
      montodefecto: rawMontoDefecto ? parseFloat(rawMontoDefecto) : 0,
      monedalineaid: Number(formData.monedaLineaId),
      diasvigencialinea: fechaADias(formData.fechaVigenciaLinea),
      monedacontratoid: Number(formData.monedaContratoId),
      diasvigenciacontrato: fechaADias(formData.fechaVigenciaContrato),
      aptanuevalinea: formData.aptanuevalinea ? "1" : "0",
      activa: formData.activa ? "1" : "0",
    };

    if (activeLinea) {
      actualizarMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Línea actualizada correctamente");
          setIsLineaModalOpen(false);
        },
        onError: (err) => {
          toast.error("Error al guardar cambios: " + err.message);
        },
      });
    } else {
      crearMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Línea de crédito creada correctamente");
          setIsLineaModalOpen(false);
        },
        onError: (err) => {
          toast.error("Error al crear la línea de crédito: " + err.message);
        },
      });
    }
  };

  const selectedCadena = listCadenas.find(
    (c) => String(c.cadenavalorid) === selectedCadenaId,
  );

  const isCadenaInactiva = selectedCadena && !selectedCadena.activaOperativa;

  const chainsSelectOptions = listCadenas.map((c) => ({
    value: String(c.cadenavalorid),
    label: `${c.denominacion} (CUIT: ${c.cuittercero || "-"})`,
  }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <h1>Líneas por Cadena de Valor</h1>
          <p>Configurá los límites permitidos para cada cadena comercial</p>
        </div>
        <div className={styles.actionsTop}>
          <Button
            variant="primary"
            onClick={handleOpenCreateModal}
            disabled={!selectedCadenaId || isCadenaInactiva}
            title={isCadenaInactiva ? "No podés operar nuevas líneas en una cadena inactiva" : "Nueva Línea"}
          >
            <FiPlus /> NUEVA LÍNEA
          </Button>
        </div>
      </div>

      <div className={styles.selectorSection}>
        {isLoadingCadenas ? (
          <Skeleton height="82px" width="100%" radius="0.75rem" />
        ) : (
          <CadenaSelectCard
            options={listCadenas}
            value={selectedCadenaId}
            onChange={(val) => setSelectedCadenaId(String(val))}
            placeholder="Seleccionar Cadena de Valor..."
          />
        )}
      </div>

      {isLoadingLineas ? (
        <div className={styles.cardGrid}>
          {[1, 2, 3].map((i) => (
            <LineaSkeletonCard key={i} />
          ))}
        </div>
      ) : selectedCadenaId && listLineas.length === 0 ? (
        <div className={styles.emptyMsg}>
          Esta cadena de valor no tiene líneas de financiamiento configuradas.
          Hacé clic en "NUEVA LÍNEA" para crear una.
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {listLineas.map((linea) => (
            <LineaCard
              key={linea.tipolimitecadenavalorid}
              linea={linea}
              currencies={currenciesOptions}
              limitTypes={limitTypesOptions}
              onEdit={handleOpenEditModal}
              onViewProducts={(l) => setActiveLineaProductosId(l.tipolimiteid)}
              onToggleStatus={handleToggleStatus}
              isToggling={togglingLineas.has(linea.tipolimitecadenavalorid)}
              isCadenaInactiva={isCadenaInactiva}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isLineaModalOpen}
        onClose={() => setIsLineaModalOpen(false)}
        title={
          activeLinea ? "EDITAR LÍNEA DE CRÉDITO" : "NUEVA LÍNEA DE CRÉDITO"
        }
        maxWidth="660px"
        variant="blue"
      >
        <div style={{ position: "relative" }}>
          {(crearMutation.isPending || actualizarMutation.isPending) && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(13, 17, 23, 0.7)",
                zIndex: 10,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: "0.5rem",
                backdropFilter: "blur(2px)",
              }}
            >
              <Spinner size={50} />
            </div>
          )}
          <form onSubmit={handleSubmitForm} className={styles.formGrid}>
            <div className={styles.formSectionDivider}>
              <FiCreditCard size={12} />
              <span>Línea</span>
            </div>

            {montoMaximoCV > 0 && (
              <div className={`${styles.cvUsageCard} ${styles.formGroupFull}`}>
                <div className={styles.cvUsageTop}>
                  <span className={styles.cvUsageLabel}>
                    Disponible de la cadena
                  </span>
                  <span className={styles.cvUsageAmount}>
                    {monedaSimbolo} {disponibleCV.toLocaleString("es-AR")}
                  </span>
                </div>
                <div className={styles.cvUsageTrack}>
                  <div
                    className={`${styles.cvUsageFill} ${
                      pctUsadoCV >= 90
                        ? styles.cvUsageFillDanger
                        : pctUsadoCV >= 70
                          ? styles.cvUsageFillWarning
                          : ""
                    }`}
                    style={{
                      transform: `scaleX(${Math.min(100, pctUsadoCV) / 100})`,
                    }}
                  />
                </div>
                <div className={styles.cvUsageBottom}>
                  <span>
                    Usado {monedaSimbolo} {utilizadoCV.toLocaleString("es-AR")}
                  </span>
                  <span>
                    Máximo {monedaSimbolo} {montoMaximoCV.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
            )}

            <div className={styles.formGroup}>
              <SelectSimple
                label="Tipo de Límite (Línea) *"
                options={limitTypesOptions}
                value={formData.tipolimiteid}
                onChange={(val) => {
                  handleInputChange("tipolimiteid", val);
                  const matchedRaw = limitTypes?.raw?.find(
                    (l) => String(l.tipolimiteid) === String(val),
                  );
                  if (matchedRaw) {
                    handleInputChange(
                      "descripcion",
                      matchedRaw.descripcionreducida || matchedRaw.descripcion,
                    );
                  }
                }}
                disabled={!!activeLinea}
                error={formErrors.tipolimiteid}
              />
            </div>

            <div className={styles.formGroup}>
              <InputSimple
                label="Descripción / Nombre de la Línea"
                value={formData.descripcion}
                onChange={(val) => handleInputChange("descripcion", val)}
                hideErrorSpace
              />
            </div>

            <div className={styles.formGroup}>
              <SelectSimple
                label="Moneda de la Línea *"
                options={currenciesOptions}
                value={formData.monedaLineaId}
                onChange={(val) => handleInputChange("monedaLineaId", val)}
                error={formErrors.monedaLineaId}
              />
            </div>

            <div className={styles.formGroup}>
              <SelectFechaSimple
                label="Vigencia de la Línea *"
                value={formData.fechaVigenciaLinea}
                onChange={(val) =>
                  handleInputChange("fechaVigenciaLinea", val)
                }
                minDate={new Date()}
                mostrarDiasDesdeHoy
                error={formErrors.fechaVigenciaLinea}
              />
            </div>

            <div className={styles.formGroup}>
              <InputSimple
                label="Monto Máximo *"
                value={formData.montomaximo}
                onChange={(val) => handleInputChange("montomaximo", val)}
                mask={`${monedaSimbolo} num`}
                blocks={{
                  num: {
                    mask: Number,
                    scale: 2,
                    signed: false,
                    thousandsSeparator: ".",
                    padFractionalZeros: true,
                    normalizeZeros: true,
                    radix: ",",
                    mapToRadix: ["."],
                  },
                }}
                lazy={false}
                error={formErrors.montomaximo}
              />
            </div>

            <div className={styles.formGroup}>
              <InputSimple
                label="Monto por Defecto"
                value={formData.montoDefecto}
                onChange={(val) => handleInputChange("montoDefecto", val)}
                mask={`${monedaSimbolo} num`}
                blocks={{
                  num: {
                    mask: Number,
                    scale: 2,
                    signed: false,
                    thousandsSeparator: ".",
                    padFractionalZeros: true,
                    normalizeZeros: true,
                    radix: ",",
                    mapToRadix: ["."],
                  },
                }}
                lazy={false}
                hideErrorSpace
              />
            </div>

            <span className={styles.formHint}>
              <FiInfo size={13} />
              <span className={styles.formHintText}>
                El <strong>Monto por Defecto</strong> es opcional: si lo dejás vacío, el socio podrá pedir cualquier monto hasta el máximo; si lo completás, ese va a ser el único monto solicitable.
              </span>
            </span>

            <div className={styles.formSectionDivider}>
              <FiFileText size={12} />
              <span>Contrato</span>
            </div>

            <div className={styles.formGroup}>
              <SelectSimple
                label="Moneda del Contrato *"
                options={currenciesOptions}
                value={formData.monedaContratoId}
                onChange={(val) => handleInputChange("monedaContratoId", val)}
                error={formErrors.monedaContratoId}
              />
            </div>

            <div className={styles.formGroup}>
              <SelectFechaSimple
                label="Vigencia del Contrato *"
                value={formData.fechaVigenciaContrato}
                onChange={(val) =>
                  handleInputChange("fechaVigenciaContrato", val)
                }
                minDate={new Date()}
                mostrarDiasDesdeHoy
                error={formErrors.fechaVigenciaContrato}
              />
            </div>

            <div className={`${styles.modalFooter} ${styles.formGroupFull}`}>
              <Button
                type="button"
                variant="outlineBlue"
                onClick={() => setIsLineaModalOpen(false)}
                disabled={
                  crearMutation.isPending || actualizarMutation.isPending
                }
              >
                CANCELAR
              </Button>
              <Button
                type="submit"
                variant="blue"
                disabled={
                  crearMutation.isPending || actualizarMutation.isPending
                }
              >
                {activeLinea ? "GUARDAR CAMBIOS" : "CREAR LÍNEA"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal de Productos Vinculados */}
      {activeLineaProductosId && (
        <ProductosVinculadosModal
          isOpen={!!activeLineaProductosId}
          onClose={() => setActiveLineaProductosId(null)}
          tipolimiteid={activeLineaProductosId}
        />
      )}
    </div>
  );
}
