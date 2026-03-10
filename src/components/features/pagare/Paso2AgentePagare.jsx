import React from "react";
import { useFormContext } from "react-hook-form";

export default function Paso2AgentePagare({ avanzarPaso }) {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="pagare-paso-animado">
      <div className="pagare-input-group-md">
        <label className="form-label">Sociedad de bolsa *</label>
        <select className="form-select" {...register("agenteBolsa")}>
          <option value="">Seleccione la sociedad de bolsa...</option>
          <option value="industrial">Industrial Valores S.A</option>
          <option value="bullmarket">Bull Market Brokers</option>
          <option value="balanz">Balanz Capital</option>
        </select>
        {errors.agenteBolsa && (
          <span className="error-text-inline">{errors.agenteBolsa.message}</span>
        )}
      </div>

      <div className="pagare-actions-right">
        <button 
          type="button" 
          className="btn-action" 
          onClick={() => avanzarPaso(["agenteBolsa"], 3)}
        >
          CONTINUAR
        </button>
      </div>
    </div>
  );
}