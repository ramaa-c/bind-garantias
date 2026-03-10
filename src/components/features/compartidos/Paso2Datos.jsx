import React from "react";
import { useFormContext } from "react-hook-form";

export default function Paso2Datos({ onVolver, onAbrirModalSms, onContinuar }) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  // Escuchamos el CUIT para mostrarlo en el resumen
  const cuitIngresado = watch("cuit", "");

  return (
    <div className="paso-2-animado">
      <div className="summary-row">
        <div>
          <span className="summary-label">Cuit:</span>
          <p className="summary-value-highlight">{cuitIngresado}</p>
        </div>
        <div>
          <span className="summary-label">Razón social:</span>
          <p className="summary-value">EMPRESA DE PRUEBA S.A.</p>
        </div>
        <button type="button" onClick={onVolver} className="btn-link">
          Editar CUIT
        </button>
      </div>

      <h3 className="step-subtitle">
        Verificá y actualizá la información en caso de ser necesario
      </h3>

      <div style={{ position: "relative", marginBottom: "2rem" }}>
        <label className="form-label">Dirección *</label>
        <input type="text" className="form-input" {...register("direccion")} />
        {errors.direccion && (
          <span className="error-text-inline">{errors.direccion.message}</span>
        )}
      </div>

      <div className="form-row">
        <div className="form-col" style={{ position: "relative" }}>
          <label className="form-label">Provincia *</label>
          <input type="text" className="form-input" {...register("provincia")} />
          {errors.provincia && (
            <span className="error-text-inline">{errors.provincia.message}</span>
          )}
        </div>
        <div className="form-col" style={{ position: "relative" }}>
          <label className="form-label">Localidad *</label>
          <input type="text" className="form-input" {...register("localidad")} />
          {errors.localidad && (
            <span className="error-text-inline">{errors.localidad.message}</span>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "flex-end",
          borderTop: "1px solid #333",
          paddingTop: "30px",
          marginTop: "30px",
        }}
      >
        <div className="input-width-md" style={{ position: "relative" }}>
          <label className="form-label">Celular *</label>
          <input
            type="text"
            placeholder="Sin 15 y cód. área sin 0"
            className="form-input"
            style={{ marginBottom: 0 }}
            {...register("celular")}
          />
          {errors.celular && (
            <span className="error-text-inline" style={{ bottom: "-25px" }}>
              {errors.celular.message}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onAbrirModalSms}
          className="btn-action btn-outline"
        >
          VERIFICAR CELULAR
        </button>
      </div>

      <div className="btn-right-container">
        <button type="button" className="btn-action" onClick={onContinuar}>
          CONTINUAR
        </button>
      </div>
    </div>
  );
}