import React from "react";
import { useFormContext } from "react-hook-form";

export default function Paso6Bolsa({ avanzarConBolsa, avanzarSinBolsa }) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="paso-6-animado">
      <h3 className="step-subtitle white">
        ¿Tiene cuenta en alguna de estas sociedades de bolsa? Si es asi seleccionala!!
      </h3>

      <div className="bolsa-container">
        <label className="form-label muted">Sociedad de bolsa *</label>
        <select className="form-select" {...register("sociedadBolsa")}>
          <option value="">Seleccionar...</option>
          <option value="Tarallo S.A.">Tarallo S.A.</option>
          <option value="Otra Sociedad">Otra Sociedad de Bolsa</option>
        </select>
      </div>

      {watch("sociedadBolsa") && watch("sociedadBolsa") !== "" && (
        <div className="bolsa-container-animated" style={{ position: "relative" }}>
          <label className="form-label muted readonly-text-highlight">
            Número de cuenta de la sociedad de bolsa *
          </label>
          <input
            type="text"
            className="form-input"
            {...register("numeroCuentaBolsa")}
          />
          {errors.numeroCuentaBolsa && (
            <span className="error-text-inline">{errors.numeroCuentaBolsa.message}</span>
          )}
        </div>
      )}

      <div className="bolsa-container step-section-lg">
        <button
          type="button"
          onClick={avanzarConBolsa}
          className="btn-large-action"
        >
          CONTINUAR CON LA SOCIEDAD DE BOLSA SELECCIONADA
        </button>
        <button
          type="button"
          onClick={avanzarSinBolsa}
          className="btn-large-outline"
        >
          NO TENGO SOCIEDAD DE BOLSA
        </button>
        <p className="info-footer-text">
          Al continuar, se le enviará un email de bienvenida al cliente
        </p>
      </div>
    </div>
  );
}