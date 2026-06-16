import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit, FiTrash2, FiX } from "react-icons/fi";
import { toast } from "sonner";

import { useObtenerTodasWeb } from "../../hooks/useCadenaValor";
import { useMonedas, useTiposProducto, useObligaciones } from "../../hooks/useCatalogos";
import {
  useObtenerLimitesCadenaValor,
  useCrearLimiteCadenaValor,
  useActualizarLimiteCadenaValor,
  useEliminarLimiteCadenaValor,
  useObtenerProductosPorLimite,
  useAsociarProductoLimite,
  useDesasociarProductoLimite,
} from "../../hooks/useLinea";

import { Select, Modal, Button, Spinner, InputSimple } from "../../components/ui";
import styles from "./LineasProductos.module.css";

// --- CHILD COMPONENT: LINE CARD ---
const LineaCard = ({
  linea,
  currencies,
  limitTypes,
  onEdit,
  onDelete,
  onAsociarProducto,
}) => {
  const { data: productosAsociados, isLoading: isLoadingProds } = useObtenerProductosPorLimite(linea.tipolimiteid);
  const { data: allObligaciones } = useObligaciones();
  const desasociarMutation = useDesasociarProductoLimite(linea.tipolimiteid);

  const moneda = currencies.find((c) => String(c.value) === String(linea.monedaid));
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

  const limitTypeDesc = limitTypes.find((t) => String(t.value) === String(linea.tipolimiteid))?.label || `Tipo #${linea.tipolimiteid}`;

  const prodsList = Array.isArray(productosAsociados) ? productosAsociados : [];

  const handleDesasociar = (p, prodName) => {
    if (window.confirm(`¿Seguro que deseas remover "${prodName}" de esta línea?`)) {
      desasociarMutation.mutate(p.tipoobligaciontipolimiteid, {
        onSuccess: () => {
          toast.success(`Producto "${prodName}" desasociado con éxito`);
        },
        onError: (err) => {
          toast.error("Error al desasociar producto: " + err.message);
        },
      });
    }
  };

  return (
    <div className={styles.lineaCard}>
      <div className={styles.cardHeader}>
        <div className={styles.headerTitleWrapper}>
          <h3 className={styles.cardTitle}>{linea.descripcion || limitTypeDesc}</h3>
          <span className={styles.cardSubtitle}>{limitTypeDesc}</span>
        </div>
        <div className={styles.cardBadges}>
          <span className={`${styles.badge} ${linea.activa === "S" ? styles.badgeSuccess : styles.badgeDanger}`}>
            {linea.activa === "S" ? "Activa" : "Inactiva"}
          </span>
          <span className={`${styles.badge} ${linea.aptanuevalinea === "S" ? styles.badgeInfo : styles.badgeDanger}`}>
            {linea.aptanuevalinea === "S" ? "Apta Alta" : "No Apta"}
          </span>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Moneda</span>
            <span className={styles.detailValue}>{monedaNombre}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Monto Máximo</span>
            <span className={styles.detailValueHighlight}>{formatMonto(linea.montonaximo)}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Vigencia</span>
            <span className={styles.detailValue}>{linea.diasvigencia} días</span>
          </div>
        </div>

        {/* Productos Asociados */}
        <div className={styles.productosSection}>
          <div className={styles.productosHeader}>
            <span className={styles.productosTitle}>Productos Habilitados</span>
            <button
              type="button"
              className={styles.btnAsociar}
              onClick={() => onAsociarProducto(linea)}
            >
              <FiPlus /> ASOCIAR
            </button>
          </div>

          {isLoadingProds ? (
            <Spinner size={20} />
          ) : prodsList.length === 0 ? (
            <span className={styles.noProducts}>No hay productos habilitados para esta línea.</span>
          ) : (
            <div className={styles.productosTagsList}>
              {prodsList.map((p) => {
                const prodName = allObligaciones?.raw?.find((o) => o.obligacionid === p.tipoobligacionid)?.descripcion || p.descripcion || `Prod #${p.tipoobligacionid}`;
                return (
                  <span key={p.tipoobligaciontipolimiteid} className={styles.prodTag}>
                    {prodName}
                    <button
                      type="button"
                      className={styles.btnRemoveProd}
                      title="Desasociar producto"
                      onClick={() => handleDesasociar(p, prodName)}
                    >
                      <FiX size={12} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className={styles.cardActions}>
        <button
          type="button"
          className={`${styles.iconBtnAction} ${styles.btnEdit}`}
          title="Editar Línea"
          onClick={() => onEdit(linea)}
        >
          <FiEdit />
        </button>
        <button
          type="button"
          className={`${styles.iconBtnAction} ${styles.btnDelete}`}
          title="Eliminar Línea"
          onClick={() => onDelete(linea)}
        >
          <FiTrash2 />
        </button>
      </div>
    </div>
  );
};

// --- CHILD COMPONENT: ASSOCIATE PRODUCT MODAL ---
const AsociarProductoModal = ({ isOpen, onClose, linea }) => {
  const { data: allObligaciones, isLoading: isLoadingAll } = useObligaciones();
  const { data: prodsAsociados, isLoading: isLoadingAsoc } = useObtenerProductosPorLimite(linea?.tipolimiteid);
  const asociarMutation = useAsociarProductoLimite();

  if (!isOpen || !linea) return null;

  const associatedIds = prodsAsociados?.map((p) => p.tipoobligacionid) || [];
  const list = allObligaciones?.raw || [];

  const handleAsociar = (ob) => {
    asociarMutation.mutate(
      {
        tipoobligaciontipolimiteid: 0,
        tipoobligacionid: ob.obligacionid,
        tipolimiteid: linea.tipolimiteid,
        descripcion: ob.descripcion,
      },
      {
        onSuccess: () => {
          toast.success(`Producto "${ob.descripcion}" habilitado con éxito`);
        },
        onError: (err) => {
          toast.error("Error al asociar producto: " + err.message);
        },
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`HABILITAR PRODUCTOS: ${linea.descripcion}`}
      maxWidth="600px"
      variant="blue"
    >
      <p style={{ fontSize: "0.825rem", color: "#8b949e", marginBottom: "1rem" }}>
        Seleccioná los productos financieros del catálogo para habilitar en esta línea.
      </p>

      {isLoadingAll || isLoadingAsoc ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
          <Spinner size={40} />
        </div>
      ) : (
        <div className={styles.modalList}>
          {list.map((ob) => {
            const isAlready = associatedIds.includes(ob.obligacionid);
            return (
              <div
                key={ob.obligacionid}
                className={`${styles.selectableItem} ${isAlready ? styles.selectableItemActive : ""}`}
                onClick={() => !isAlready && handleAsociar(ob)}
                style={{ cursor: isAlready ? "default" : "pointer", opacity: isAlready ? 0.7 : 1 }}
              >
                <div>
                  <div className={styles.productName}>{ob.descripcion}</div>
                  <div className={styles.productDesc}>
                    ID: #{ob.obligacionid} | Plazo Máx: {ob.diasmaximoplazo} días
                  </div>
                </div>
                <div>
                  {isAlready ? (
                    <span style={{ fontSize: "0.75rem", color: "#3ddc84", fontWeight: "bold" }}>HABILITADO</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="blue"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAsociar(ob);
                      }}
                    >
                      HABILITAR
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.modalFooter}>
        <Button variant="outlineBlue" onClick={onClose}>
          CERRAR
        </Button>
      </div>
    </Modal>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function LineasProductos() {
  const [selectedCadenaId, setSelectedCadenaId] = useState("");
  const [isLineaModalOpen, setIsLineaModalOpen] = useState(false);
  const [activeLinea, setActiveLinea] = useState(null); // null means "Create"

  const [formData, setFormData] = useState({
    tipolimiteid: "",
    monedaid: "",
    descripcion: "",
    montonaximo: "",
    diasvigencia: "",
    aptanuevalinea: true,
    activa: true,
  });

  const [asociarModal, setAsociarModal] = useState({
    isOpen: false,
    linea: null,
  });

  // Queries
  const { data: cadenas, isLoading: isLoadingCadenas } = useObtenerTodasWeb();
  const { data: lineas, isLoading: isLoadingLineas } = useObtenerLimitesCadenaValor(selectedCadenaId);
  const { data: monedas } = useMonedas();
  const { data: limitTypes } = useTiposProducto();

  // Mutations
  const crearMutation = useCrearLimiteCadenaValor();
  const actualizarMutation = useActualizarLimiteCadenaValor();
  const eliminarMutation = useEliminarLimiteCadenaValor(selectedCadenaId);

  const listCadenas = cadenas || [];
  const listLineas = lineas || [];
  const currenciesOptions = monedas?.opciones || [];
  const limitTypesOptions = limitTypes?.opciones || [];

  // Auto-select first value chain
  useEffect(() => {
    if (listCadenas.length > 0 && !selectedCadenaId) {
      setSelectedCadenaId(String(listCadenas[0].cadenavalorid));
    }
  }, [listCadenas, selectedCadenaId]);

  // Handle Form Change
  const handleInputChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleOpenCreateModal = () => {
    setActiveLinea(null);
    setFormData({
      tipolimiteid: limitTypesOptions.length > 0 ? limitTypesOptions[0].value : "",
      monedaid: currenciesOptions.length > 0 ? currenciesOptions[0].value : "",
      descripcion: "",
      montonaximo: "",
      diasvigencia: "",
      aptanuevalinea: true,
      activa: true,
    });
    setIsLineaModalOpen(true);
  };

  const handleOpenEditModal = (linea) => {
    setActiveLinea(linea);
    setFormData({
      tipolimiteid: String(linea.tipolimiteid),
      monedaid: String(linea.monedaid),
      descripcion: linea.descripcion || "",
      montonaximo: String(linea.montonaximo),
      diasvigencia: String(linea.diasvigencia),
      aptanuevalinea: linea.aptanuevalinea === "S",
      activa: linea.activa === "S",
    });
    setIsLineaModalOpen(true);
  };

  const handleDeleteLinea = (linea) => {
    const desc = linea.descripcion || `Línea #${linea.tipolimitecadenavalorid}`;
    if (window.confirm(`¿Seguro que deseas eliminar la línea "${desc}" de esta cadena?`)) {
      eliminarMutation.mutate(linea.tipolimitecadenavalorid, {
        onSuccess: () => {
          toast.success("Línea eliminada correctamente");
        },
        onError: (err) => {
          toast.error("Error al eliminar la línea: " + err.message);
        },
      });
    }
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();

    if (!formData.tipolimiteid || !formData.monedaid || !formData.montonaximo || !formData.diasvigencia) {
      toast.warning("Por favor completa todos los campos obligatorios");
      return;
    }

    const payload = {
      tipolimitecadenavalorid: activeLinea ? activeLinea.tipolimitecadenavalorid : 0,
      cadenavalorid: Number(selectedCadenaId),
      tipolimiteid: Number(formData.tipolimiteid),
      descripcion: formData.descripcion || "",
      monedaid: Number(formData.monedaid),
      montonaximo: parseFloat(formData.montonaximo),
      diasvigencia: parseInt(formData.diasvigencia, 10),
      aptanuevalinea: formData.aptanuevalinea ? "S" : "N",
      activa: formData.activa ? "S" : "N",
    };

    if (activeLinea) {
      actualizarMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Línea de crédito modificada correctamente");
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

  if (isLoadingCadenas) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "5rem" }}>
        <Spinner size={80} />
      </div>
    );
  }

  const selectedCadena = listCadenas.find((c) => String(c.cadenavalorid) === selectedCadenaId);

  const chainsSelectOptions = listCadenas.map((c) => ({
    value: String(c.cadenavalorid),
    label: `${c.denominacion} (CUIT: ${c.cuittercero || "-"})`,
  }));

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <h1>Líneas y Productos por Cadena de Valor</h1>
          <p>Configurá los límites permitidos y los productos habilitados para cada cadena comercial</p>
        </div>
        <div className={styles.actionsTop}>
          <button
            className={styles.btnNuevo}
            onClick={handleOpenCreateModal}
            disabled={!selectedCadenaId}
          >
            <FiPlus /> NUEVA LÍNEA
          </button>
        </div>
      </div>

      {/* Selector de Cadena */}
      <div className={styles.selectorCard}>
        <div className={styles.selectGroup}>
          <label className={styles.selectLabel}>Seleccionar Cadena de Valor</label>
          <Select
            options={chainsSelectOptions}
            value={selectedCadenaId}
            onChange={(val) => setSelectedCadenaId(val)}
            placeholder="Seleccione una cadena..."
            isSearchable
          />
        </div>
      </div>

      {/* Grid de Líneas */}
      {isLoadingLineas ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Spinner size={60} />
        </div>
      ) : listLineas.length === 0 ? (
        <div className={styles.emptyMsg}>
          Esta cadena de valor no tiene líneas de financiamiento configuradas. Hacé clic en "NUEVA LÍNEA" para crear una.
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
              onDelete={handleDeleteLinea}
              onAsociarProducto={(l) => setAsociarModal({ isOpen: true, linea: l })}
            />
          ))}
        </div>
      )}

      {/* Modal para Crear / Editar Línea */}
      <Modal
        isOpen={isLineaModalOpen}
        onClose={() => setIsLineaModalOpen(false)}
        title={activeLinea ? "EDITAR LÍNEA DE CRÉDITO" : "NUEVA LÍNEA DE CRÉDITO"}
        maxWidth="600px"
        variant="blue"
      >
        <form onSubmit={handleSubmitForm} className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Tipo de Límite (Línea) *</label>
            <Select
              options={limitTypesOptions}
              value={formData.tipolimiteid}
              onChange={(val) => handleInputChange("tipolimiteid", val)}
              placeholder="Seleccione..."
            />
          </div>

          <div className={styles.formGroup}>
            <label>Moneda *</label>
            <Select
              options={currenciesOptions}
              value={formData.monedaid}
              onChange={(val) => handleInputChange("monedaid", val)}
              placeholder="Seleccione..."
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
              type="number"
              value={formData.montonaximo}
              onChange={(val) => handleInputChange("montonaximo", val)}
            />
          </div>

          <div className={styles.formGroup}>
            <InputSimple
              label="Días de Vigencia *"
              type="number"
              value={formData.diasvigencia}
              onChange={(val) => handleInputChange("diasvigencia", val)}
            />
          </div>

          <div className={`${styles.formGroup} ${styles.formGroupFull}`} style={{ display: "flex", flexDirection: "row", gap: "2rem" }}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.formCheckbox}
                checked={formData.activa}
                onChange={(e) => handleInputChange("activa", e.target.checked)}
              />
              Línea Activa
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.formCheckbox}
                checked={formData.aptanuevalinea}
                onChange={(e) => handleInputChange("aptanuevalinea", e.target.checked)}
              />
              Apta Nuevas Operaciones
            </label>
          </div>

          <div className={`${styles.modalFooter} ${styles.formGroupFull}`}>
            <Button type="button" variant="outlineBlue" onClick={() => setIsLineaModalOpen(false)}>
              CANCELAR
            </Button>
            <Button type="submit" variant="blue">
              {activeLinea ? "GUARDAR CAMBIOS" : "CREAR LÍNEA"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal para Asociar Producto */}
      {asociarModal.isOpen && (
        <AsociarProductoModal
          isOpen={asociarModal.isOpen}
          onClose={() => setAsociarModal({ isOpen: false, linea: null })}
          linea={asociarModal.linea}
        />
      )}
    </div>
  );
}
