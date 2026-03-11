import React from "react";
import { useFormContext } from "react-hook-form";

export default function Paso1SimuladorPagare({ simulacionLista, setSimulacionLista, montoWatch, handleCalcularSimulacion, setPasoActual }) {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="pagare-paso-animado">
      <div className="form-row">
        <div className="form-col">
          <label className="form-label muted">Moneda *</label>
          <input type="text" value="Dólar" disabled className="form-input" />
        </div>

        <div className="form-col" style={{ position: "relative" }}>
          <label className="form-label">Monto del Pagaré *</label>
          <input type="number" placeholder="Ej: 40000" className="form-input" {...register("monto")} disabled={simulacionLista} />
          {errors.monto && <span className="error-text-inline">{errors.monto.message}</span>}
        </div>

        <div className="form-col" style={{ position: "relative" }}>
          <label className="form-label">Fecha de pago *</label>
          <input type="date" className="form-input" {...register("fechaPago")} disabled={simulacionLista} />
          {errors.fechaPago && <span className="error-text-inline">{errors.fechaPago.message}</span>}
        </div>
      </div>

      {!simulacionLista ? (
        <div className="pagare-actions-right">
          <button type="button" onClick={handleCalcularSimulacion} className="btn-action">CALCULAR</button>
        </div>
      ) : (
        <div className="pagare-breakdown-container">
          <div className="pagare-breakdown-header">
            <span>Neto estimado a recibir:</span>
            <span className="text-yellow">USD {montoWatch * 0.96}</span>
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
            <button type="button" onClick={() => setPasoActual(2)} className="btn-action">CONTINUAR CON ESTA SIMULACIÓN</button>
          </div>
        </div>
      )}
    </div>
  );
}