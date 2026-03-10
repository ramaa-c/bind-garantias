import React from "react";
import { useFormContext } from "react-hook-form";

export default function Paso3Simulador({ mostrarResultados, onCalcular, onContinuar }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="paso-3-animado">
      <div className="warning-box">
        <p className="warning-text">Este cálculo es una simulación...</p>
      </div>
      <div className="form-row">
        <div className="form-col">
          <label className="form-label muted">Moneda *</label>
          <select className="form-select" {...register("moneda")}>
            <option value="Pesos">Pesos</option>
          </select>
        </div>
        <div className="form-col">
          <label className="form-label muted">Tipo de producto *</label>
          <select className="form-select" {...register("tipoProducto")}>
            <option value="cheque">Cheque de pago diferido</option>
          </select>
        </div>
      </div>
      <div className="bolsa-container">
        <label className="form-label muted">Tipo de cálculo *</label>
        <select className="form-select" {...register("tipoCalculo")}>
          <option value="tasa-directa">Tasa Directa</option>
        </select>
      </div>
      <div className="form-row bolsa-container-animated">
        <div className="form-col" style={{ position: "relative" }}>
          <label className="form-label muted">Monto a financiar</label>
          <input type="number" className="form-input" {...register("monto")} />
          {errors.monto && (
            <span className="error-text-inline">{errors.monto.message}</span>
          )}
        </div>
        <div className="form-col">
          <label className="form-label muted">Plazo</label>
          <select className="form-select" {...register("plazo")}>
            <option value="30">30 días</option>
          </select>
        </div>
      </div>

      {!mostrarResultados && (
        <div className="form-actions-right">
          <button type="button" className="btn-action" onClick={onCalcular}>
            CALCULAR
          </button>
        </div>
      )}

      {mostrarResultados && (
        <div className="results-container">
          <div className="results-header">
            <h3 className="results-title">Neto estimado a recibir:</h3>
            <p className="results-amount">$ 2.532.096</p>
          </div>
          <div className="info-box">
            <p>Tasa de interés estimativa.</p>
          </div>
          <div className="form-actions-center bolsa-container">
            <button type="button" className="btn-action" onClick={onContinuar}>
              CONTINUAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}