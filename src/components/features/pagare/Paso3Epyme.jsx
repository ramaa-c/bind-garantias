import React from "react";
import { useFormContext } from "react-hook-form";
import { FaFileArrowDown, FaLink } from "react-icons/fa6";

export default function Paso3Epyme() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="pagare-paso-animado">
      <h3 className="pagare-subtitle">El emisor ha sido pre-aprobado *</h3>

      <div className="pagare-epyme-container">
        <div className="pagare-epyme-card">
          <div className="pagare-epyme-icon"><FaLink /></div>
          <p>Primero generá el pagaré desde el siguiente link</p>
          <a href="https://epyme.cajadevalores.com.ar/login" target="_blank" rel="noreferrer" className="btn-outline pagare-epyme-btn">IR A ePYME</a>
        </div>

        <div className="pagare-epyme-card">
          <div className="pagare-epyme-icon"><FaFileArrowDown /></div>
          <p>Completá la operación. Podés guiarte con este instructivo.</p>
          <button type="button" className="btn-outline pagare-epyme-btn">DESCARGAR INSTRUCTIVO</button>
        </div>
      </div>

      <div className="pagare-input-group-md" style={{ marginTop: "3rem", maxWidth: "100%" }}>
        <label className="form-label">Luego ingresá el ID obtenido para finalizar la operación: *</label>
        <input type="text" placeholder="Número identificatorio (ej: 1234789558666)" className="form-input pagare-input-id" {...register("idEpyme")} />
        {errors.idEpyme && <span className="error-text-inline">{errors.idEpyme.message}</span>}
      </div>

      <div className="pagare-input-group-md" style={{ maxWidth: "100%", marginBottom: "1rem" }}>
        <label className="form-label muted">¿Tenés algún mensaje para el equipo de Bind Garantías? (Opcional)</label>
        <textarea className="form-input pagare-textarea" rows="3" {...register("mensaje")}></textarea>
      </div>

      <div className="pagare-actions-right">
        <p className="pagare-disclaimer-text">* Sujeto a confirmación en la recepción de documentación física y a cambios en el score.</p>
        <button type="submit" className="btn-action" style={{ marginTop: "1rem" }}>FINALIZAR SOLICITUD</button>
      </div>
    </div>
  );
}