import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiSave, FiRefreshCw, FiPercent, FiDollarSign, FiInfo } from "react-icons/fi";
import { toast } from "sonner";
import styles from "./AdminTasasMontos.module.css";

const parametrosBase = {
  lineas: {
    tasaGeneral: 35.5,
    montoMinimo: 1000000,
    montoMaximo: 500000000,
    comisionOtorgamiento: 1.5,
  },
  cheques: {
    tasaGeneral: 28.0,
    montoMinimo: 50000,
    montoMaximo: 25000000,
    comisionOtorgamiento: 2.0,
  },
  pagares: {
    tasaGeneral: 32.0,
    montoMinimo: 500000,
    montoMaximo: 150000000,
    comisionOtorgamiento: 1.0,
  },
  prestamos: {
    tasaGeneral: 45.0,
    montoMinimo: 2000000,
    montoMaximo: 80000000,
    comisionOtorgamiento: 2.5,
  },
};

export default function AdminTasasMontos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabQuery = searchParams.get("tab") || "lineas";

  const [activeTab, setActiveTab] = useState(tabQuery);
  const [parametros, setParametros] = useState(parametrosBase);
  const [hasChanges, setHasChanges] = useState(false);

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
    toast.success("Parámetros actualizados correctamente", {
      description: `Las nuevas tasas y límites para "${activeTab.toUpperCase()}" ya están vigentes.`,
    });
    setHasChanges(false);
  };

  const handleRestablecer = () => {
    setParametros(parametrosBase);
    setHasChanges(false);
    toast.info("Valores restablecidos a su configuración original");
  };

  const currentParams = parametros[activeTab];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Gestión de Tasas y Límites Operativos</h1>
          <p>
            Modificá en tiempo real las tasas de interés (TNA), comisiones y los montos
            mínimos/máximos permitidos por producto.
          </p>
        </div>
        <div className={styles.actionsTop}>
          <button
            onClick={handleRestablecer}
            className={styles.btnReset}
            title="Deshacer cambios locales"
          >
            <FiRefreshCw /> Restablecer
          </button>
          <button
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
        <button
          className={`${styles.tabBtn} ${activeTab === "lineas" ? styles.tabActive : ""}`}
          onClick={() => handleTabChange("lineas")}
        >
          Líneas de Crédito
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "cheques" ? styles.tabActive : ""}`}
          onClick={() => handleTabChange("cheques")}
        >
          Cheques Avalados
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "pagares" ? styles.tabActive : ""}`}
          onClick={() => handleTabChange("pagares")}
        >
          Pagarés Bursátiles
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "prestamos" ? styles.tabActive : ""}`}
          onClick={() => handleTabChange("prestamos")}
        >
          Préstamos
        </button>
      </div>

      {/* Editor Cards Grid */}
      <div className={styles.contentGrid}>
        {/* Tasa General Card */}
        <div className={styles.editorCard}>
          <div className={styles.cardHeader}>
            <div className={styles.iconBoxYellow}>
              <FiPercent />
            </div>
            <div>
              <h3>Tasa de Interés Nominal Anual (TNA)</h3>
              <span className={styles.subtitle}>Tasa base de referencia del producto</span>
            </div>
          </div>

          <div className={styles.inputArea}>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                step="0.1"
                value={currentParams.tasaGeneral}
                onChange={(e) => handleParamChange("tasaGeneral", e.target.value)}
                className={styles.bigInput}
              />
              <span className={styles.unitSuffix}>%</span>
            </div>

            <input
              type="range"
              min="5"
              max="120"
              step="0.5"
              value={currentParams.tasaGeneral}
              onChange={(e) => handleParamChange("tasaGeneral", e.target.value)}
              className={styles.customSlider}
            />
            <div className={styles.sliderLabels}>
              <span>5%</span>
              <span>Valor actual: {currentParams.tasaGeneral}%</span>
              <span>120%</span>
            </div>
          </div>
          <div className={styles.infoFooter}>
            <FiInfo /> Impacta en el simulador y cálculo de cuotas de las solicitudes futuras.
          </div>
        </div>

        {/* Comisión de Otorgamiento Card */}
        <div className={styles.editorCard}>
          <div className={styles.cardHeader}>
            <div className={styles.iconBoxBlue}>
              <FiPercent />
            </div>
            <div>
              <h3>Comisión de Aval / Otorgamiento</h3>
              <span className={styles.subtitle}>Porcentaje flat aplicado al capital</span>
            </div>
          </div>

          <div className={styles.inputArea}>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                step="0.1"
                value={currentParams.comisionOtorgamiento}
                onChange={(e) => handleParamChange("comisionOtorgamiento", e.target.value)}
                className={styles.bigInput}
              />
              <span className={styles.unitSuffix}>%</span>
            </div>

            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={currentParams.comisionOtorgamiento}
              onChange={(e) => handleParamChange("comisionOtorgamiento", e.target.value)}
              className={styles.customSlider}
            />
            <div className={styles.sliderLabels}>
              <span>0%</span>
              <span>Actual: {currentParams.comisionOtorgamiento}%</span>
              <span>10%</span>
            </div>
          </div>
          <div className={styles.infoFooter}>
            <FiInfo /> Cobro administrativo facturado al momento de monetizar la operación.
          </div>
        </div>

        {/* Monto Mínimo Permitido */}
        <div className={styles.editorCard}>
          <div className={styles.cardHeader}>
            <div className={styles.iconBoxGreen}>
              <FiDollarSign />
            </div>
            <div>
              <h3>Monto Mínimo Permitido</h3>
              <span className={styles.subtitle}>Umbral inferior para ingresar solicitudes</span>
            </div>
          </div>

          <div className={styles.inputArea}>
            <div className={styles.inputWrapper}>
              <span className={styles.prefixSymbol}>$</span>
              <input
                type="number"
                step="10000"
                value={currentParams.montoMinimo}
                onChange={(e) => handleParamChange("montoMinimo", e.target.value)}
                className={styles.bigInput}
              />
            </div>
            <div className={styles.formattedPreview}>
              Formato: <strong>$ {new Intl.NumberFormat("es-AR").format(currentParams.montoMinimo)}</strong>
            </div>
          </div>
          <div className={styles.infoFooter}>
            <FiInfo /> Evita la creación de transacciones con montos demasiado bajos.
          </div>
        </div>

        {/* Monto Máximo Permitido */}
        <div className={styles.editorCard}>
          <div className={styles.cardHeader}>
            <div className={styles.iconBoxPurple}>
              <FiDollarSign />
            </div>
            <div>
              <h3>Monto Máximo (Tope Operativo)</h3>
              <span className={styles.subtitle}>Límite superior global por operación</span>
            </div>
          </div>

          <div className={styles.inputArea}>
            <div className={styles.inputWrapper}>
              <span className={styles.prefixSymbol}>$</span>
              <input
                type="number"
                step="500000"
                value={currentParams.montoMaximo}
                onChange={(e) => handleParamChange("montoMaximo", e.target.value)}
                className={styles.bigInput}
              />
            </div>
            <div className={styles.formattedPreview}>
              Formato: <strong>$ {new Intl.NumberFormat("es-AR").format(currentParams.montoMaximo)}</strong>
            </div>
          </div>
          <div className={styles.infoFooter}>
            <FiInfo /> Sujeto a la precalificación crediticia y validación patrimonial del socio.
          </div>
        </div>
      </div>
    </div>
  );
}
