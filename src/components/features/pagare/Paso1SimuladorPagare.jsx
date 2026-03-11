import React from "react";
import { useFormContext } from "react-hook-form";

export default function Paso1SimuladorPagare({ simulacionLista, setSimulacionLista, montoWatch, handleCalcularSimulacion, setPasoActual }) {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="pagare-paso-animado">
      
      {/* EL INPUT GIGANTE DE DINERO */}
      <div className="money-input-wrapper">
        <label className="money-input-label">Monto del Pagaré</label>
        <div className="money-input-container">
          <span className="money-currency">U$D</span>
          <input 
            type="number" 
            placeholder="0" 
            className="input-money-huge" 
            {...register("monto")} 
            disabled={simulacionLista} 
          />
        </div>
        {errors.monto && <span className="error-text-centered">{errors.monto.message}</span>}
      </div>

      {/* LOS DATOS SECUNDARIOS ABAJO */}
      <div className="form-row" style={{ marginTop: '2rem', justifyContent: 'center' }}>
        <div className="form-col" style={{ maxWidth: '200px' }}>
          <label className="form-label muted">Moneda</label>
          <input type="text" value="Dólar" disabled className="form-input text-center" />
        </div>

        <div className="form-col" style={{ maxWidth: '200px', position: "relative" }}>
          <label className="form-label">Fecha de pago *</label>
          <input type="date" className="form-input" {...register("fechaPago")} disabled={simulacionLista} />
          {errors.fechaPago && <span className="error-text-inline">{errors.fechaPago.message}</span>}
        </div>
      </div>

      {!simulacionLista ? (
        <div className="pagare-actions-center">
          <button type="button" onClick={handleCalcularSimulacion} className="btn-action btn-lg-modern">
            SIMULAR COSTOS
          </button>
        </div>
      ) : (
        <div className="pagare-breakdown-container">
          <div className="pagare-breakdown-header">
            <span>Neto estimado a recibir:</span>
            <span className="text-yellow text-xl">USD {montoWatch * 0.96}</span>
          </div>
          <div className="pagare-breakdown-body">
            <div className="pagare-breakdown-row"><span>Comisión SGR</span><span>USD 811</span></div>
            <div className="pagare-breakdown-row"><span>Descuento operado</span><span>USD 446</span></div>
            <div className="pagare-breakdown-row"><span>Derecho mercado</span><span>USD 24</span></div>
            <div className="pagare-breakdown-row"><span>IVA</span><span>USD 5</span></div>
            <div className="pagare-breakdown-row pagare-total-row">
              <span className="text-yellow">Total de costos</span>
              <span className="text-yellow">USD 1.286</span>
            </div>
          </div>
          <div className="warning-box" style={{ marginTop: "20px" }}>
            <p className="warning-text"><span className="warning-highlight">IMPORTANTE:</span> Tasa de interés utilizada para el cálculo: % TNA (cierre al día hábil cambiario anterior).</p>
          </div>
          <div className="pagare-actions-flex">
            <button type="button" onClick={() => setSimulacionLista(false)} className="btn-outline">RECALCULAR</button>
            <button type="button" onClick={() => setPasoActual(2)} className="btn-action">CONTINUAR</button>
          </div>
        </div>
      )}
    </div>
  );
}