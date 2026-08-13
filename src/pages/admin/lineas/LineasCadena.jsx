import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiList,
  FiCreditCard,
  FiFileText,
  FiCalendar,
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
} from "../../../components/ui";
import { CadenaSelectCard } from "../../../components/features/admin/CadenaSelectCard/CadenaSelectCard";
import styles from "./LineasProductos.module.css";

const MOCK_MONEDAS = [
  { monedaid: 2, simbolo: "u$s" },
  { monedaid: 10, simbolo: "UVAS" },
  { monedaid: 500, simbolo: "Euros" },
  { monedaid: 5000, simbolo: "$ARG" },
];

// El backend guarda la vigencia en días (DiasVigenciaLinea/Contrato), no
// como fecha: el input pide directamente ese número. Esto solo se usa para
// mostrar a qué fecha equivale, a modo de ayuda visual.
const formatearVencimiento = (diasStr) => {
  const dias = parseInt(diasStr, 10);
  if (!dias || dias <= 0) return null;
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
        <div className={styles.moneyGrid}>
          <div className={styles.moneyBlock}>
            <Skeleton height="0.7rem" width="40px" />
            <Skeleton height="1.2rem" width="110px" style={{ marginTop: "0.2rem" }} />
            <Skeleton height="0.7rem" width="90px" style={{ marginTop: "0.2rem" }} />
          </div>
          <div className={styles.moneyDivider} />
          <div className={styles.moneyBlock}>
            <Skeleton height="0.7rem" width="55px" />
            <Skeleton height="1.2rem" width="100px" style={{ marginTop: "0.2rem" }} />
            <Skeleton height="0.7rem" width="90px" style={{ marginTop: "0.2rem" }} />
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
  limitTypes,
  onEdit,
  onViewProducts,
  onToggleStatus,
  isToggling,
  isCadenaInactiva,
}) => {
  let limitTypeDesc = "Desconocida";
  if (limitTypes) {
    const matched = limitTypes.find(
      (m) => String(m.value) === String(linea.tipolimiteid),
    );
    if (matched) limitTypeDesc = matched.label;
  }

  // Línea y Contrato pueden tener cada uno su propia moneda (ambos se eligen
  // por separado en el modal, acotados a las monedas permitidas por la
  // cadena) — se resuelve el símbolo de cada uno por separado en vez de
  // asumir que comparten el mismo.
  const simboloDe = (monedaId) =>
    MOCK_MONEDAS.find((m) => String(m.monedaid) === String(monedaId))
      ?.simbolo || "$";
  const simboloMonedaLinea = simboloDe(linea.monedalineaid);
  const simboloMonedaContrato = simboloDe(linea.monedacontratoid);

  const esMontoUnico = String(linea.valorespordefecto) === "1";

  const vigenciaLineaTexto = [
    linea.diasvigencialinea ? `${linea.diasvigencialinea} días` : null,
    formatearVencimiento(linea.diasvigencialinea)
      ? `vence ${formatearVencimiento(linea.diasvigencialinea)}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const vigenciaContratoTexto = [
    linea.diasvigenciacontrato ? `${linea.diasvigenciacontrato} días` : null,
    formatearVencimiento(linea.diasvigenciacontrato)
      ? `vence ${formatearVencimiento(linea.diasvigenciacontrato)}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

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
        <div className={styles.moneyGrid}>
          <div className={styles.moneyBlock}>
            <span className={styles.moneyLabel}>Línea</span>
            <span className={styles.moneyAmount}>
              {simboloMonedaLinea}{" "}
              {parseFloat(linea.montolinea || 0).toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </span>
            {vigenciaLineaTexto && (
              <span className={styles.moneyCaption}>{vigenciaLineaTexto}</span>
            )}
            {esMontoUnico && (
              <span className={styles.moneyChip} title="Monto único solicitable">
                Monto Único
              </span>
            )}
          </div>

          <div className={styles.moneyDivider} />

          <div className={styles.moneyBlock}>
            <span className={styles.moneyLabel}>Contrato</span>
            <span className={`${styles.moneyAmount} ${styles.moneyAmountMuted}`}>
              {simboloMonedaContrato}{" "}
              {parseFloat(linea.montocontrato || 0).toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </span>
            {vigenciaContratoTexto && (
              <span className={styles.moneyCaption}>{vigenciaContratoTexto}</span>
            )}
          </div>
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
  // Snapshot del formData al abrir el modal en modo edición: permite
  // deshabilitar "GUARDAR CAMBIOS" si no se modificó nada (estándar de UX
  // para evitar PUTs sin cambios reales). null en modo creación, donde no
  // aplica.
  const [formDataInicial, setFormDataInicial] = useState(null);

  const [formData, setFormData] = useState({
    tipolimiteid: "",
    monedaLineaId: "",
    monedaContratoId: "",
    descripcion: "",
    montoLinea: "",
    montoContrato: "",
    montoUnico: false,
    diasVigenciaLinea: "",
    diasVigenciaContrato: "",
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

  const selectedCadena = listCadenas.find(
    (c) => String(c.cadenavalorid) === selectedCadenaId,
  );

  const selectedMonedaData = monedas?.raw?.find(
    (m) => String(m.monedaid) === String(formData.monedaLineaId),
  );
  const monedaSimbolo = selectedMonedaData?.simbolo || "$";

  // La moneda de la cadena (CadenaValor.MonedaID) acota qué monedas puede
  // tener una línea: si la cadena es en Pesos (5000), sus líneas solo pueden
  // ser en Pesos; si es en Dólares (2), sus líneas pueden ser en Pesos o en
  // Dólares. Se aplica tanto a la moneda de la Línea como a la del Contrato.
  const monedaCadenaId = selectedCadena?.monedaid
    ? Number(selectedCadena.monedaid)
    : null;
  const monedasPermitidasIds =
    monedaCadenaId === 2 ? [2, 5000] : [5000];
  const currenciesOptionsTodas = monedas?.opciones || [];
  const currenciesOptions = monedaCadenaId
    ? currenciesOptionsTodas.filter((o) =>
        monedasPermitidasIds.includes(Number(o.value)),
      )
    : currenciesOptionsTodas;
  const limitTypesOptions = limitTypes?.opciones || [];

  // Techo real de la cadena para el Monto de Línea de una línea nueva: lo que
  // ya se admitió y no se puede volver a comprometer (MontoMaximoCV) y lo que
  // efectivamente queda libre hoy (Disponible = MontoMaximoCV - Utilizado).
  //
  // El campo "Disponible" que devuelve GET CadenaValor/Utilizado/{id} viene
  // mal calculado desde el backend (confirmado: para una cadena con
  // MontoMaximoCV=200M y Utilizado=0 devuelve Disponible=0 en vez de 200M) -
  // se recalcula acá en vez de confiar en ese campo. Reportado a Victor.
  //
  // El "Utilizado" tampoco sale de ese endpoint: se recalcula sumando el
  // MontoLinea de las líneas (TipoLimiteCadenaValor) ya configuradas para
  // esta cadena - cada línea dada de alta compromete ese cupo contra el
  // máximo de la cadena, aunque los socios todavía no la hayan usado. Al
  // editar una línea existente se excluye su propio valor actual, para no
  // restarse a sí misma contra el disponible. Ahora que la cadena tiene su
  // propia moneda, solo se suman las líneas cuya MonedaLineaID está entre las
  // permitidas para esa cadena - evita mezclar líneas de otra moneda que
  // hayan quedado de antes de esta restricción.
  const montoMaximoCV = Number(utilizadoCadena?.montomaximocv) || 0;
  const utilizadoCV = listLineas.reduce((acc, l) => {
    const esLaQueSeEstaEditando =
      activeLinea &&
      Number(l.tipolimitecadenavalorid) ===
        Number(activeLinea.tipolimitecadenavalorid);
    if (esLaQueSeEstaEditando) return acc;
    if (!monedasPermitidasIds.includes(Number(l.monedalineaid))) return acc;
    return acc + (Number(l.montolinea) || 0);
  }, 0);
  const disponibleCV = Math.max(0, montoMaximoCV - utilizadoCV);
  const pctUsadoCV = montoMaximoCV > 0 ? (utilizadoCV / montoMaximoCV) * 100 : 0;

  const montoLineaIngresado = parseFloat(limpiarMonto(formData.montoLinea)) || 0;
  const montoContratoIngresado =
    parseFloat(limpiarMonto(formData.montoContrato)) || 0;

  const sinCambios =
    !!activeLinea &&
    !!formDataInicial &&
    JSON.stringify(formData) === JSON.stringify(formDataInicial);

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
    setFormDataInicial(null);
    setFormData({
      tipolimiteid: "",
      monedaLineaId: "",
      monedaContratoId: "",
      descripcion: "",
      montoLinea: "",
      montoContrato: "",
      montoUnico: false,
      diasVigenciaLinea: "",
      diasVigenciaContrato: "",
      aptanuevalinea: true,
      activa: true,
    });
    setIsLineaModalOpen(true);
  };

  const handleOpenEditModal = (linea) => {
    setActiveLinea(linea);
    setFormErrors({});

    const datosLinea = {
      tipolimiteid: String(linea.tipolimiteid),
      monedaLineaId: String(linea.monedalineaid),
      monedaContratoId: String(linea.monedacontratoid),
      descripcion: linea.descripcion || "",
      montoLinea: String(linea.montolinea),
      montoContrato: linea.montocontrato != null ? String(linea.montocontrato) : "",
      montoUnico: String(linea.valorespordefecto) === "1",
      diasVigenciaLinea: linea.diasvigencialinea
        ? String(linea.diasvigencialinea)
        : "",
      diasVigenciaContrato: linea.diasvigenciacontrato
        ? String(linea.diasvigenciacontrato)
        : "",
      aptanuevalinea: String(linea.aptanuevalinea) === "1",
      activa: String(linea.activa) === "1",
    };
    setFormData(datosLinea);
    setFormDataInicial(datosLinea);
    setIsLineaModalOpen(true);
  };

  // Sin toast genérico: cada campo obligatorio muestra su propio error
  // debajo (mismo patrón que ya usan InputSimple/SelectSimple), así se ve de
  // un vistazo qué falta en vez de un mensaje flotante que desaparece solo.
  const validarFormulario = () => {
    const errores = {};

    if (!formData.tipolimiteid) errores.tipolimiteid = "Elegí un tipo de línea";
    if (!formData.monedaLineaId) errores.monedaLineaId = "Elegí una moneda";
    if (!formData.monedaContratoId) errores.monedaContratoId = "Elegí una moneda";
    if (!formData.diasVigenciaLinea || parseInt(formData.diasVigenciaLinea, 10) <= 0) {
      errores.diasVigenciaLinea = "Ingresá los días de vigencia";
    }
    if (!formData.diasVigenciaContrato || parseInt(formData.diasVigenciaContrato, 10) <= 0) {
      errores.diasVigenciaContrato = "Ingresá los días de vigencia";
    }

    if (!formData.montoLinea || montoLineaIngresado <= 0) {
      errores.montoLinea = "Ingresá el monto de la línea";
    } else if (montoMaximoCV > 0 && montoLineaIngresado > montoMaximoCV) {
      errores.montoLinea = `Supera el máximo de la cadena (${monedaSimbolo} ${montoMaximoCV.toLocaleString("es-AR")})`;
    }

    if (!formData.montoContrato || montoContratoIngresado <= 0) {
      errores.montoContrato = "Ingresá el monto del contrato";
    } else if (
      montoLineaIngresado > 0 &&
      montoLineaIngresado > montoContratoIngresado
    ) {
      errores.montoContrato = "El monto de línea no puede ser mayor al del contrato";
    }

    return errores;
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();

    const errores = validarFormulario();
    setFormErrors(errores);
    if (Object.keys(errores).length > 0) return;

    const rawMontoLinea = limpiarMonto(formData.montoLinea);
    const rawMontoContrato = limpiarMonto(formData.montoContrato);

    // Techo real de la cadena: si pide más de lo que la cadena admite en
    // total ya se rechazó arriba. Si entra dentro del máximo pero supera lo
    // que hoy queda libre, se acepta topeada al disponible.
    let montoLineaFinal = parseFloat(rawMontoLinea);
    if (montoMaximoCV > 0 && montoLineaFinal > disponibleCV) {
      montoLineaFinal = disponibleCV;
    }

    const payload = {
      tipolimitecadenavalorid: activeLinea
        ? activeLinea.tipolimitecadenavalorid
        : 0,
      cadenavalorid: Number(selectedCadenaId),
      tipolimiteid: Number(formData.tipolimiteid),
      descripcion: formData.descripcion || "",
      montolinea: montoLineaFinal,
      montocontrato: parseFloat(rawMontoContrato) || 0,
      valorespordefecto: formData.montoUnico ? "1" : "0",
      monedalineaid: Number(formData.monedaLineaId),
      diasvigencialinea: parseInt(formData.diasVigenciaLinea, 10) || 0,
      monedacontratoid: Number(formData.monedaContratoId),
      diasvigenciacontrato: parseInt(formData.diasVigenciaContrato, 10) || 0,
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
              <div className={styles.unitInputWrapper}>
                <InputSimple
                  label="Vigencia de la Línea (días) *"
                  value={formData.diasVigenciaLinea}
                  onChange={(val) =>
                    handleInputChange("diasVigenciaLinea", val)
                  }
                  mask={Number}
                  scale={0}
                  signed={false}
                  min={0}
                  max={3650}
                  thousandsSeparator="."
                  lazy={false}
                  error={formErrors.diasVigenciaLinea}
                />
                <span className={styles.unitSuffix}>días</span>
              </div>
              {formatearVencimiento(formData.diasVigenciaLinea) && (
                <span className={styles.dueDateChip}>
                  <FiCalendar size={11} />
                  Vence el {formatearVencimiento(formData.diasVigenciaLinea)}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <InputSimple
                label="Monto de la Línea *"
                value={formData.montoLinea}
                onChange={(val) => handleInputChange("montoLinea", val)}
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
                error={formErrors.montoLinea}
              />
            </div>

            <div className={styles.uniqueAmountCard}>
              <label className={styles.uniqueAmountCardTop}>
                <span className={styles.uniqueAmountSwitch}>
                  <input
                    type="checkbox"
                    className={styles.uniqueAmountSwitchInput}
                    checked={formData.montoUnico}
                    onChange={(e) =>
                      handleInputChange("montoUnico", e.target.checked)
                    }
                  />
                  <span className={styles.uniqueAmountSwitchTrack}>
                    <span className={styles.uniqueAmountSwitchThumb} />
                  </span>
                </span>
                <span className={styles.uniqueAmountCardLabel}>
                  Monto predeterminado
                </span>
              </label>
              <span className={styles.uniqueAmountCardCaption}>
                {formData.montoUnico
                  ? "Activado: las solicitudes desde el cliente van a usar este monto como valor predeterminado."
                  : "Desactivado: el socio va a poder solicitar cualquier monto dentro de este rango."}
              </span>
            </div>

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
              <div className={styles.unitInputWrapper}>
                <InputSimple
                  label="Vigencia del Contrato (días) *"
                  value={formData.diasVigenciaContrato}
                  onChange={(val) =>
                    handleInputChange("diasVigenciaContrato", val)
                  }
                  mask={Number}
                  scale={0}
                  signed={false}
                  min={0}
                  max={3650}
                  thousandsSeparator="."
                  lazy={false}
                  error={formErrors.diasVigenciaContrato}
                />
                <span className={styles.unitSuffix}>días</span>
              </div>
              {formatearVencimiento(formData.diasVigenciaContrato) && (
                <span className={styles.dueDateChip}>
                  <FiCalendar size={11} />
                  Vence el {formatearVencimiento(formData.diasVigenciaContrato)}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <InputSimple
                label="Monto del Contrato *"
                value={formData.montoContrato}
                onChange={(val) => handleInputChange("montoContrato", val)}
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
                error={formErrors.montoContrato}
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
                  crearMutation.isPending ||
                  actualizarMutation.isPending ||
                  sinCambios
                }
                title={sinCambios ? "No hay cambios para guardar" : undefined}
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
