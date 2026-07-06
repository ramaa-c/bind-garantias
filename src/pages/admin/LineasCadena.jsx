import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit, FiTrash2, FiX, FiList } from "react-icons/fi";
import { toast } from "sonner";

import { useObtenerTodasWeb } from "../../hooks/useCadenaValor";
import { useMonedas, useTiposProducto, useObligaciones } from "../../hooks/useCatalogos";
import {
  useObtenerLimitesCadenaValor,
  useCrearLimiteCadenaValor,
  useActualizarLimiteCadenaValor,
  useObtenerProductosPorLimite,
} from "../../hooks/useLinea";
import {
  SelectSimple,
  Modal,
  Button,
  Spinner,
  InputSimple,
  SelectFechaSimple,
} from "../../components/ui";
import { CadenaSelectCard } from "../../components/features/admin/CadenaSelectCard/CadenaSelectCard";
import styles from "./LineasProductos.module.css";

const MOCK_MONEDAS = [
  { monedaid: 2, simbolo: "u$s" },
  { monedaid: 10, simbolo: "UVAS" },
  { monedaid: 500, simbolo: "Euros" },
  { monedaid: 5000, simbolo: "$ARG" },
];

// --- CHILD COMPONENT: SKELETON CARD ---
const LineaSkeletonCard = () => {
  return (
    <div className={styles.lineaCard}>
      <div className={styles.cardHeader}>
        <div className={styles.headerTitleWrapper}>
          <div
            className={styles.skeletonBlock}
            style={{ height: "1rem", width: "180px" }}
          ></div>
          <div
            className={styles.skeletonBlock}
            style={{ height: "0.75rem", width: "100px" }}
          ></div>
        </div>
        <div className={styles.headerActions}>
          <div
            className={styles.skeletonBlock}
            style={{ height: "32px", width: "32px", borderRadius: "0.375rem" }}
          ></div>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <div
              className={styles.skeletonBlock}
              style={{ height: "0.75rem", width: "60px" }}
            ></div>
            <div
              className={styles.skeletonBlock}
              style={{ height: "1rem", width: "120px" }}
            ></div>
          </div>
          <div className={styles.detailItem}>
            <div
              className={styles.skeletonBlock}
              style={{ height: "0.75rem", width: "70px" }}
            ></div>
            <div
              className={styles.skeletonBlock}
              style={{ height: "1rem", width: "90px" }}
            ></div>
          </div>
          <div className={`${styles.detailItem} ${styles.fullWidthItem}`}>
            <div
              className={styles.skeletonBlock}
              style={{ height: "0.75rem", width: "80px" }}
            ></div>
            <div
              className={styles.skeletonBlock}
              style={{ height: "1.25rem", width: "140px" }}
            ></div>
          </div>
        </div>
      </div>

      <div className={styles.cardTogglesBottom}>
        <div
          className={styles.skeletonBlock}
          style={{ height: "1.25rem", width: "100px", borderRadius: "0.25rem" }}
        ></div>
        <div
          className={styles.skeletonBlock}
          style={{ height: "1.25rem", width: "150px", borderRadius: "0.25rem" }}
        ></div>
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
        <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
          <Spinner size={30} />
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
  const moneda = currencies.find(
    (c) => String(c.value) === String(linea.monedaid),
  );
  const monedaNombre = moneda ? moneda.label : `Moneda #${linea.monedaid}`;

  const formatMonto = (num) => {
    const val = parseFloat(num);
    if (isNaN(val)) return "-";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: moneda?.raw?.codigoiso || "ARS",
      minimumFractionDigits: 2,
    }).format(val);
  };

  let limitTypeDesc = "Desconocida";
  if (limitTypes) {
    const matched = limitTypes.find(
      (m) => String(m.value) === String(linea.tipolimiteid),
    );
    if (matched) limitTypeDesc = matched.label;
  }

  const monedaMock = MOCK_MONEDAS.find(
    (m) => String(m.monedaid) === String(linea.monedaid),
  );
  const simboloMoneda = monedaMock ? monedaMock.simbolo : "$";

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
            <span className={styles.detailLabel}>MONEDA</span>
            <span className={styles.detailValue}>{monedaNombre}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>VIGENCIA</span>
            <span className={styles.detailValue}>
              {linea.diasvigencia} días
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

  const [formData, setFormData] = useState({
    tipolimiteid: "",
    monedaid: "",
    descripcion: "",
    montomaximo: "",
    fechavigencia: "",
    aptanuevalinea: true,
    activa: true,
  });

  // Queries
  const { data: cadenas, isLoading: isLoadingCadenas } = useObtenerTodasWeb();
  const { data: lineas, isLoading: isLoadingLineas } =
    useObtenerLimitesCadenaValor(selectedCadenaId);
  const { data: monedas } = useMonedas();
  const { data: limitTypes } = useTiposProducto();

  // Mutations
  const crearMutation = useCrearLimiteCadenaValor();
  const actualizarMutation = useActualizarLimiteCadenaValor();

  const listCadenas = cadenas || [];
  const listLineas = lineas || [];

  const selectedMonedaData = monedas?.raw?.find(
    (m) => String(m.monedaid) === String(formData.monedaid),
  );
  const monedaSimbolo = selectedMonedaData?.simbolo || "$";

  const currenciesOptions = monedas?.opciones || [];
  const limitTypesOptions = limitTypes?.opciones || [];

  useEffect(() => {
    if (listCadenas.length > 0 && !selectedCadenaId) {
      setSelectedCadenaId(String(listCadenas[0].cadenavalorid));
    }
  }, [listCadenas, selectedCadenaId]);

  const handleInputChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
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
    setFormData({
      tipolimiteid: "",
      monedaid: "",
      descripcion: "",
      montomaximo: "",
      fechavigencia: "",
      aptanuevalinea: true,
      activa: true,
    });
    setIsLineaModalOpen(true);
  };

  const handleOpenEditModal = (linea) => {
    setActiveLinea(linea);

    const dias = parseInt(linea.diasvigencia, 10);
    let fecha = "";
    if (!isNaN(dias)) {
      const d = new Date();
      d.setDate(d.getDate() + dias);
      d.setHours(12, 0, 0, 0);
      fecha = d.toISOString();
    }

    setFormData({
      tipolimiteid: String(linea.tipolimiteid),
      monedaid: String(linea.monedaid),
      descripcion: linea.descripcion || "",
      montomaximo: String(linea.montomaximo),
      fechavigencia: fecha,
      aptanuevalinea: String(linea.aptanuevalinea) === "1",
      activa: String(linea.activa) === "1",
    });
    setIsLineaModalOpen(true);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();

    if (
      !formData.tipolimiteid ||
      !formData.monedaid ||
      !formData.montomaximo ||
      !formData.fechavigencia
    ) {
      toast.warning("Por favor completa todos los campos obligatorios");
      return;
    }

    const diffTime = new Date(formData.fechavigencia) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diasVigenciaFinal = diffDays > 0 ? diffDays : 0;

    let rawMonto = formData.montomaximo;
    if (typeof rawMonto === "string") {
      rawMonto = rawMonto.replace(/[^0-9,]/g, "").replace(",", ".");
    }

    const payload = {
      tipolimitecadenavalorid: activeLinea
        ? activeLinea.tipolimitecadenavalorid
        : 0,
      cadenavalorid: Number(selectedCadenaId),
      tipolimiteid: Number(formData.tipolimiteid),
      descripcion: formData.descripcion || "",
      monedaid: Number(formData.monedaid),
      montomaximo: parseFloat(rawMonto),
      diasvigencia: diasVigenciaFinal,
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

  const isCadenaInactiva = selectedCadena && (
    String(selectedCadena.activa) === "0" || 
    selectedCadena.activa === false || 
    String(selectedCadena.activa).toLowerCase() === "false"
  );

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
          <div
            className={styles.skeletonBlock}
            style={{ height: "82px", width: "100%", borderRadius: "0.75rem" }}
          ></div>
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
        maxWidth="600px"
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
              />
            </div>

            <div className={styles.formGroup}>
              <SelectSimple
                label="Moneda *"
                options={currenciesOptions}
                value={formData.monedaid}
                onChange={(val) => handleInputChange("monedaid", val)}
              />
            </div>

            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
              <InputSimple
                label="Descripción / Nombre de la Línea"
                value={formData.descripcion}
                onChange={(val) => handleInputChange("descripcion", val)}
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
              />
            </div>

            <div className={styles.formGroup}>
              <SelectFechaSimple
                label="Fecha de Vencimiento *"
                value={formData.fechavigencia}
                onChange={(val) => handleInputChange("fechavigencia", val)}
                minDate={new Date()}
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
