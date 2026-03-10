import React from "react";
import { useFormContext } from "react-hook-form";

export default function Paso1Cuit({ onValidar }) {
  // useFormContext nos permite acceder a register y errors sin pasarlos por props!
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div>
      <label className="form-label">
        Cuit <span className="required-asterisk">*</span>
      </label>
      <div className="form-row-align" style={{ position: "relative" }}>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Ingresá tu CUIT (11 números)"
            className="form-input input-width-md"
            {...register("cuit")}
          />
          {errors.cuit && (
            <span className="error-text-inline">{errors.cuit.message}</span>
          )}
        </div>
        <button type="button" onClick={onValidar} className="btn-validate">
          VALIDAR CUIT
        </button>
      </div>
    </div>
  );
}