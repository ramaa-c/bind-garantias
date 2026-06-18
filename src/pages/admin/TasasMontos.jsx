import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiSave, FiRefreshCw, FiPercent, FiDollarSign, FiInfo } from "react-icons/fi";
import { toast } from "sonner";
import { ConfirmacionModal } from "../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import styles from "./TasasMontos.module.css";

const STORAGE_KEY = "tasas_y_montos_config";

const defaultParametros = {
  lineas: {
    tasaGeneral: 35.5,
    montoMinimo: 1000000,
    montoMaximo: 500000000,
    comisionOtorgamiento: 1.5,
  },
  cheques: {
    tasaGeneral: 43.34,
    montoMinimo: 50000,
    montoMaximo: 25000000,
    comisionOtorgamiento: 2.5,
    derechoMercado: 0.0476,
    arancelBolsa: 0.2219,
    valoresCobro: 6000,
    gestionCobro: 70,
  },
  pagares: {
    tasaGeneral: 32.0,
    montoMinimo: 500000,
    montoMaximo: 150000000,
    comisionOtorgamiento: 2.0275,
    derechoMercado: 0.06,
    arancelBolsa: 1.115,
  },
  prestamos: {
    tasaGeneral: 44.0,
    montoMinimo: 2000000,
    montoMaximo: 80000000,
    comisionBanco: 1.0,
    comisionSgr: 2.0,
  },
};

const getInitialParametros = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const merged = { ...defaultParametros };
      Object.keys(defaultParametros).forEach((key) => {
        merged[key] = { ...defaultParametros[key], ...parsed[key] };
      });
      return merged;
    } catch (e) {
      console.error("Error parsing stored config", e);
    }
  }
  return defaultParametros;
};

const camposConfig = {
  tasaGeneral: {
    label: "Tasa de Interés Nominal Anual (TNA)",
    subtitle: "Tasa base de referencia del producto",
    type: "percentage",
    iconType: "yellow",
    min: 5,
    max: 120,
    step: 0.01,
    footer: "Impacta en el simulador y cálculo de intereses de las solicitudes.",
  },
  comisionOtorgamiento: {
    label: "Comisión de Otorgamiento / SGR",
    subtitle: "Porcentaje flat aplicado al capital de la operación",
    type: "percentage",
    iconType: "blue",
    min: 0,
    max: 10,
    step: 0.01,
    footer: "Costo flat facturado al momento de monetizar la operación.",
  },
  comisionBanco: {
    label: "Comisión del Banco (Directo)",
    subtitle: "Porcentaje directo del banco otorgante",
    type: "percentage",
    iconType: "blue",
    min: 0,
    max: 10,
    step: 0.1,
    footer: "Comisión directa cobrada por la entidad bancaria.",
  },
  comisionSgr: {
    label: "Comisión SGR (TNA)",
    subtitle: "Porcentaje TNA de la SGR avalista",
    type: "percentage",
    iconType: "blue",
    min: 0,
    max: 10,
    step: 0.1,
    footer: "Comisión anual por el aval de la Sociedad de Garantía Recíproca.",
  },
  derechoMercado: {
    label: "Derecho de Mercado",
    subtitle: "Porcentaje cobrado por el mercado (MAV)",
    type: "percentage",
    iconType: "blue",
    min: 0,
    max: 1,
    step: 0.0001,
    footer: "Arancel regulado cobrado por el mercado correspondiente.",
  },
  arancelBolsa: {
    label: "Arancel Sociedad de Bolsa / ALyC",
    subtitle: "Porcentaje de intermediación de la ALyC",
    type: "percentage",
    iconType: "blue",
    min: 0,
    max: 5,
    step: 0.001,
    footer: "Arancel cobrado por el Agente de Liquidación y Compensación.",
  },
  valoresCobro: {
    label: "Gasto de Valores al Cobro",
    subtitle: "Costo administrativo fijo por cheque cargado",
    type: "currency",
    iconType: "green",
    step: 100,
    footer: "Costo administrativo fijo cobrado por la gestión de valores.",
  },
  gestionCobro: {
    label: "Gasto de Gestión de Cobro",
    subtitle: "Costo fijo administrativo de gestión",
    type: "currency",
    iconType: "green",
    step: 5,
    footer: "Costo administrativo fijo por gestión de cobros.",
  },
  montoMinimo: {
    label: "Monto Mínimo Permitido",
    subtitle: "Umbral inferior para ingresar solicitudes",
    type: "currency",
    iconType: "green",
    step: 1000,
    footer: "Evita la creación de transacciones con montos demasiado bajos.",
  },
  montoMaximo: {
    label: "Monto Máximo (Tope Operativo)",
    subtitle: "Límite superior global por operación",
    type: "currency",
    iconType: "purple",
    step: 100000,
    footer: "Sujeto a la capacidad de aval y precalificación crediticia del socio.",
  },
};

const camposPorTab = {
  lineas: ["tasaGeneral", "comisionOtorgamiento", "montoMinimo", "montoMaximo"],
  cheques: [
    "tasaGeneral",
    "comisionOtorgamiento",
    "derechoMercado",
    "arancelBolsa",
    "valoresCobro",
    "gestionCobro",
    "montoMinimo",
    "montoMaximo",
  ],
  pagares: [
    "tasaGeneral",
    "comisionOtorgamiento",
    "derechoMercado",
    "arancelBolsa",
    "montoMinimo",
    "montoMaximo",
  ],
  prestamos: [
    "tasaGeneral",
    "comisionBanco",
    "comisionSgr",
    "montoMinimo",
    "montoMaximo",
  ],
};

const tabMonedas = {
  lineas: "$",
  cheques: "$",
  pagares: "U$D",
  prestamos: "$",
};

export default function TasasMontos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabQuery = searchParams.get("tab") || "lineas";

  const [activeTab, setActiveTab] = useState(tabQuery);
  const [parametros, setParametros] = useState(getInitialParametros);
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleParamChange = (field, value) => {
    setParametros((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: parseFloat(value) || 0,
      },
    }));
    setHasChanges(true);
  };

  const handleGuardar = () => {
    setConfirmOpen(true);
  };

  const confirmSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parametros));
    toast.success("Parámetros actualizados correctamente", {
      description: `Las nuevas tasas y límites para "${activeTab.toUpperCase()}" ya están vigentes en toda la plataforma.`,
    });
    setHasChanges(false);
    setConfirmOpen(false);
  };

  const handleRestablecer = () => {
    setParametros(defaultParametros);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultParametros));
    setHasChanges(false);
    toast.info("Valores restablecidos a su configuración original");
  };

  const currentParams = parametros[activeTab] || {};
  const currencySymbol = tabMonedas[activeTab] || "$";

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Gestión de Tasas y Límites Operativos</h1>
          <p>
            Modificá en tiempo real las tasas de interés (TNA), comisiones y los montos
            mínimos/máximos permitidos por producto para toda la zona de clientes.
          </p>
        </div>
        <div className={styles.actionsTop}>
          <button type="button"
            onClick={handleRestablecer}
            className={styles.btnReset}
            title="Deshacer cambios locales y volver a configuración de fábrica"
          >
            <FiRefreshCw /> Restablecer
          </button>
          <button type="button"
            onClick={handleGuardar}
            className={`${styles.btnSave} ${hasChanges ? styles.btnSaveGlow : ""}`}
            disabled={!hasChanges}
          >
            <FiSave /> Guardar Cambios
          </button>
        </div>
      </div>

      {/* Product Tabs */}
      <div className={styles.tabsWrapper}>
        <button type="button"
          className={`${styles.tabBtn} ${activeTab === "lineas" ? styles.tabActive : ""}`}
          onClick={() => handleTabChange("lineas")}
        >
          Líneas de Crédito
        </button>
        <button type="button"
          className={`${styles.tabBtn} ${activeTab === "cheques" ? styles.tabActive : ""}`}
          onClick={() => handleTabChange("cheques")}
        >
          Cheques Avalados
        </button>
        <button type="button"
          className={`${styles.tabBtn} ${activeTab === "pagares" ? styles.tabActive : ""}`}
          onClick={() => handleTabChange("pagares")}
        >
          Pagarés Bursátiles
        </button>
        <button type="button"
          className={`${styles.tabBtn} ${activeTab === "prestamos" ? styles.tabActive : ""}`}
          onClick={() => handleTabChange("prestamos")}
        >
          Préstamos
        </button>
      </div>

      {/* Editor Cards Grid */}
      <div className={styles.contentGrid}>
        {(camposPorTab[activeTab] || []).map((fieldName) => {
          const config = camposConfig[fieldName];
          if (!config) return null;
          const val = currentParams[fieldName] !== undefined ? currentParams[fieldName] : 0;
          const isPercentage = config.type === "percentage";
          
          const iconClass =
            config.iconType === "yellow"
              ? styles.iconBoxYellow
              : config.iconType === "blue"
                ? styles.iconBoxBlue
                : config.iconType === "green"
                  ? styles.iconBoxGreen
                  : styles.iconBoxPurple;

          return (
            <div key={fieldName} className={styles.editorCard}>
              <div className={styles.cardHeader}>
                <div className={iconClass}>
                  {isPercentage ? <FiPercent /> : <FiDollarSign />}
                </div>
                <div>
                  <h3>{config.label}</h3>
                  <span className={styles.subtitle}>{config.subtitle}</span>
                </div>
              </div>

              <div className={styles.inputArea}>
                <div className={styles.inputWrapper}>
                  {!isPercentage && <span className={styles.prefixSymbol}>{currencySymbol}</span>}
                  <input
                    type="number"
                    step={config.step}
                    value={val}
                    onChange={(e) => handleParamChange(fieldName, e.target.value)}
                    className={styles.bigInput}
                  />
                  {isPercentage && <span className={styles.unitSuffix}>%</span>}
                </div>

                {isPercentage && (
                  <>
                    <input
                      type="range"
                      min={config.min}
                      max={config.max}
                      step={config.step}
                      value={val}
                      onChange={(e) => handleParamChange(fieldName, e.target.value)}
                      className={styles.customSlider}
                    />
                    <div className={styles.sliderLabels}>
                      <span>{config.min}%</span>
                      <span>Valor actual: {val}%</span>
                      <span>{config.max}%</span>
                    </div>
                  </>
                )}

                {!isPercentage && (
                  <div className={styles.formattedPreview}>
                    Formato: <strong>{currencySymbol} {new Intl.NumberFormat("es-AR").format(val)}</strong>
                  </div>
                )}
              </div>
              <div className={styles.infoFooter}>
                <FiInfo /> {config.footer}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmacionModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmSave}
        titulo="Guardar Tasas y Límites"
        mensaje={`¿Estás seguro de que deseas actualizar las tasas y límites operativos para ${activeTab === 'lineas' ? 'Líneas de Crédito' : activeTab === 'cheques' ? 'Cheques Avalados' : activeTab === 'pagares' ? 'Pagarés Bursátiles' : 'Préstamos'}? Estos cambios impactarán en tiempo real.`}
        variant="blue"
        confirmText="GUARDAR"
        cancelText="CANCELAR"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
      />
    </div>
  );
}