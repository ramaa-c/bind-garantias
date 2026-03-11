import React from "react";
import { useFormContext } from "react-hook-form";
import { FiCheckCircle, FiEdit2, FiSmartphone } from "react-icons/fi";

export default function Paso2Datos({ onVolver, onAbrirModalSms, onContinuar }) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const cuitIngresado = watch("cuit", "");

  return (
    <div className="paso-2-animado">
      
      {/* TARJETA DE RESUMEN VERIFICADO */}
      <div className="verified-summary-card">
        <div className="summary-info-group">
          <div className="summary-status">
            <FiCheckCircle className="status-icon-check" />
            <span className="summary-label-modern">CUIT Validado</span>
          </div>
          <p className="summary-value-highlight">{cuitIngresado}</p>
          <p className="summary-value-business">EMPRESA DE PRUEBA S.A.</p>
        </div>
        <button type="button" onClick={onVolver} className="btn-edit-ghost">
          <FiEdit2 size={14} /> Editar
        </button>
      </div>

      <h3 className="step-subtitle white" style={{ marginTop: '2rem' }}>
        Verificá y actualizá la información en caso de ser necesario
      </h3>

      {/* INPUTS CON ESPACIO PARA ERRORES (Anti-Layout Shift) */}
      <div className="form-group-spaced">
        <label className="form-label">Dirección *</label>
        <input type="text" className="form-input" {...register("direccion")} />
        {errors.direccion && (
          <span className="error-text-absolute">{errors.direccion.message}</span>
        )}
      </div>

      <div className="form-row">
        <div className="form-col form-group-spaced">
          <label className="form-label">Provincia *</label>
          <input type="text" className="form-input" {...register("provincia")} />
          {errors.provincia && (
            <span className="error-text-absolute">{errors.provincia.message}</span>
          )}
        </div>
        <div className="form-col form-group-spaced">
          <label className="form-label">Localidad *</label>
          <input type="text" className="form-input" {...register("localidad")} />
          {errors.localidad && (
            <span className="error-text-absolute">{errors.localidad.message}</span>
          )}
        </div>
      </div>

      {/* ZONA DE VERIFICACIÓN DE CELULAR */}
      <div className="phone-verification-zone">
        <div className="phone-input-wrapper form-group-spaced">
          <label className="form-label">Celular *</label>
          <div className="input-with-icon">
            <FiSmartphone className="input-icon" />
            <input
              type="text"
              placeholder="Sin 15 y cód. área sin 0"
              className="form-input form-input-pl"
              {...register("celular")}
            />
          </div>
          {errors.celular && (
            <span className="error-text-absolute">{errors.celular.message}</span>
          )}
        </div>
        
        <button
          type="button"
          onClick={onAbrirModalSms}
          className="btn-outline btn-verify"
        >
          VERIFICAR SMS
        </button>
      </div>

      <div className="form-actions-right">
        <button type="button" className="btn-action" onClick={onContinuar}>
          CONTINUAR
        </button>
      </div>
    </div>
  );
}