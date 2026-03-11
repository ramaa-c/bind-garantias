import React from "react";
import { useFormContext } from "react-hook-form";
import { FaFileArrowDown, FaLink, FaLock } from "react-icons/fa6";

export default function Paso3Epyme() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="pagare-paso-animado">
      <h3 className="pagare-subtitle">
        <FaLock
          style={{
            marginRight: "10px",
            fontSize: "1.2rem",
            verticalAlign: "middle",
          }}
        />
        Generación y Vinculación de Pagaré
      </h3>

      <div className="pagare-epyme-container">
        <a
          href="https://epyme.cajadevalores.com.ar/login"
          target="_blank"
          rel="noreferrer"
          className="pagare-epyme-card action-card"
        >
          <div className="pagare-epyme-icon">
            <FaLink />
          </div>
          <p>
            Primero generá el pagaré desde la plataforma oficial de Caja de
            Valores.
          </p>
          <span className="btn-outline pagare-epyme-btn">IR A ePYME</span>
        </a>

        <div className="pagare-epyme-card action-card">
          <div className="pagare-epyme-icon">
            <FaFileArrowDown />
          </div>
          <p>
            ¿Dudas con la plataforma? Guiate paso a paso con este instructivo
            detallado.
          </p>
          <button type="button" className="btn-outline pagare-epyme-btn">
            VER INSTRUCTIVO
          </button>
        </div>
      </div>

      <div className="pagare-input-group-md secure-input-container">
        <label
          className="form-label"
          style={{ fontSize: "1.1rem", color: "var(--white)" }}
        >
          ID de Operación ePYME *
        </label>
        <p className="form-label muted" style={{ marginBottom: "20px" }}>
          Ingresá el número identificatorio generado para finalizar la
          solicitud.
        </p>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="EJ: 1234789558666"
            className="form-input secure-token-input"
            {...register("idEpyme")}
          />
          {errors.idEpyme && (
            <span className="error-text-centered" style={{ bottom: "-25px" }}>
              {errors.idEpyme.message}
            </span>
          )}
        </div>
      </div>

      <div
        className="pagare-input-group-md"
        style={{ maxWidth: "100%", marginBottom: "1rem" }}
      >
        <label className="form-label muted">
          ¿Tenés algún mensaje o aclaración para el equipo? (Opcional)
        </label>
        <textarea
          className="form-input pagare-textarea"
          rows="3"
          {...register("mensaje")}
          placeholder="Escribí acá tus comentarios..."
        ></textarea>
      </div>

      <div
        className="pagare-actions-right"
        style={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <p
          className="pagare-disclaimer-text"
          style={{ textAlign: "left", margin: 0, maxWidth: "60%" }}
        >
          * Sujeto a confirmación en la recepción de documentación física y a
          cambios en el score.
        </p>
        <button
          type="submit"
          className="btn-action"
          style={{ borderRadius: "8px", padding: "12px 30px" }}
        >
          FINALIZAR SOLICITUD
        </button>
      </div>
    </div>
  );
}
