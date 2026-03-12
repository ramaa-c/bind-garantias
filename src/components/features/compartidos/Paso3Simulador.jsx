import React from "react";
import { useFormContext } from "react-hook-form";
import { FiInfo } from "react-icons/fi";

export default function Paso3Simulador({ mostrarResultados, onCalcular, onContinuar }) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const tipoCalculo = watch("tipoCalculo", "tasa_directa");
  const esPorMontoCheque = tipoCalculo === "por_monto_cheque";

  return (
    <div className="paso-3-animado">
      
      <div className="simulador-params-grid" style={{ marginBottom: '3rem' }}>
        <div className="form-group-spaced" style={{ marginBottom: 0 }}>
          <label className="form-label muted">Moneda *</label>
          <select className="form-select" {...register("moneda")} disabled={mostrarResultados}>
            <option value="Pesos">Pesos</option>
            <option value="Dolares">Dólares</option>
          </select>
        </div>
        <div className="form-group-spaced" style={{ marginBottom: 0 }}>
          <label className="form-label muted">Tipo de producto *</label>
          <select className="form-select" {...register("tipoProducto")} disabled={mostrarResultados}>
            <option value="cheques_propios">Cheques propios</option>
            <option value="cheques_terceros">Cheques de terceros</option>
          </select>
        </div>
        <div className="form-group-spaced" style={{ marginBottom: 0 }}>
          <label className="form-label muted">Tipo de cálculo *</label>
          <select className="form-select" {...register("tipoCalculo")} disabled={mostrarResultados}>
            <option value="tasa_directa">Tasa Directa / Monto a financiar</option>
            <option value="por_monto_cheque">Por monto de cheque</option>
          </select>
        </div>
      </div>

      <div className="dynamic-inputs-row">
        
        <div className="money-input-wrapper" style={{ margin: 0, flex: 1 }}>
          <label className="money-input-label">
            {esPorMontoCheque ? "Monto de cheque *" : "Monto a financiar *"}
          </label>
          <div className="money-input-container" style={{ justifyContent: 'flex-start' }}>
            <span className="money-currency">$</span>
            <input
              type="number"
              placeholder="0"
              className="input-money-huge"
              {...register("monto")}
              disabled={mostrarResultados}
            />
          </div>
          {errors.monto && (
            <span className="error-text-absolute" style={{ bottom: '-25px' }}>
              {errors.monto.message}
            </span>
          )}
        </div>

        <div className="form-group-spaced time-input-wrapper" style={{ flex: 1, maxWidth: '250px' }}>
          <label className="form-label muted">
            {esPorMontoCheque ? "Fecha de pago *" : "Plazo (Fecha) *"}
          </label>
          <input 
            type="date" 
            className="form-input" 
            {...register(esPorMontoCheque ? "fechaPago" : "plazo")} 
            disabled={mostrarResultados} 
            style={{ fontSize: '1rem',  }}
          />
          {esPorMontoCheque && errors.fechaPago && (
            <span className="error-text-absolute" style={{ bottom: '-25px' }}>{errors.fechaPago.message}</span>
          )}
          {!esPorMontoCheque && errors.plazo && (
            <span className="error-text-absolute" style={{ bottom: '-25px' }}>{errors.plazo.message}</span>
          )}
        </div>
      </div>

      {/* ACCIONES Y RESULTADOS */}
      {!mostrarResultados ? (
        <div className="form-actions-center" style={{ marginTop: '3rem' }}>
          <button type="button" className="btn-action btn-lg-modern" onClick={onCalcular}>
            CALCULAR
          </button>
        </div>
      ) : (
        <div className="results-container-modern">
          <div className="results-header-modern">
            <h3 className="results-title-modern">Neto estimado a recibir:</h3>
            <p className="results-amount-modern">$ 2.712.752</p>
          </div>
          
          <div className="results-body-modern">
            <div className="results-row"><span>Comisión Garantías (2.5%)</span><span>$ 15.822</span></div>
            <div className="results-row"><span>Intereses (43.34% TNA*)</span><span>$ 254.299</span></div>
            <div className="results-row"><span>Derecho bolsa</span><span>$ 0</span></div>
            <div className="results-row"><span>Derecho mercado (0.06%)</span><span>$ 1.428</span></div>
            <div className="results-row"><span>Arancel Soc Bolsa</span><span>$ 6.658</span></div>
            <div className="results-row"><span>Valores al cobro</span><span>$ 6.000</span></div>
            <div className="results-row"><span>Gestión de cobro</span><span>$ 70</span></div>
            <div className="results-row"><span>IVA</span><span>$ 2.973</span></div>
            <div className="results-row results-total-row">
              <span className="text-yellow">Total de costos</span>
              <span className="text-yellow">$ 287.248</span>
            </div>
            <div className="results-row" style={{ marginTop: '10px' }}>
              <span style={{ color: '#aaa' }}>CFT estimado</span>
              <span style={{ color: '#aaa' }}>49.55% anual</span>
            </div>
          </div>

          <div className="results-summary-box">
            <div className="summary-box-row">
              <span>{esPorMontoCheque ? "Vto del cheque" : "Plazo estimado"}</span>
              <strong>31/07/2026</strong>
            </div>
            <div className="summary-box-row">
              <span>{esPorMontoCheque ? "Monto del cheque" : "Monto a financiar"}</span>
              <strong>$ 3.000.000</strong>
            </div>
          </div>

          <div className="warning-box-modern" style={{ marginTop: '2rem' }}>
            <FiInfo className="warning-icon" />
            <p className="warning-text">
              Tasa promocional subvencionada. IMPORTANTE: La tasa de interés utilizada en el simulador es estimativa.
            </p>
          </div>
          
          <div className="form-actions-flex" style={{ flexDirection: 'column', alignItems: 'center', marginTop: '2rem', gap: '15px' }}>
            <button type="button" className="btn-action" onClick={onContinuar} style={{ width: '100%', maxWidth: '400px' }}>
              CONTINUAR
            </button>
            <button type="button" className="btn-link action-secondary" style={{ fontSize: '0.9rem' }}>
              Desisto de avanzar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}