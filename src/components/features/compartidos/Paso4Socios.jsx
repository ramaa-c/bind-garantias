import React from "react";
import { FiEdit, FiTrash2 } from "react-icons/fi";

export default function Paso4Socios({
  faseSocio,
  setFaseSocio,
  tempSocioCuit,
  setTempSocioCuit,
  tempSocioNombre,
  tempSocioParticipacion,
  setTempSocioParticipacion,
  socios,
  iniciarCargaSocio,
  validarCuitSocio,
  guardarSocio,
  eliminarSocio,
  continuarAlProximoPaso,
}) {
  return (
    <div className="paso-4-animado">
      {faseSocio === "ingresar_cuit" && (
        <div className="step-section">
          <h3 className="step-subtitle highlight">CARGAR UN SOCIO</h3>
          <label className="form-label muted">Cuit</label>
          <div className="form-row-align">
            <input
              type="text"
              value={tempSocioCuit}
              onChange={(e) => setTempSocioCuit(e.target.value)}
              className="form-input input-width-md"
            />
            <button
              type="button"
              onClick={validarCuitSocio}
              className="btn-validate"
            >
              VALIDAR CUIT
            </button>
          </div>
        </div>
      )}

      {faseSocio === "completar_datos" && (
        <div className="step-section">
          <h3 className="step-subtitle highlight">CARGAR UN SOCIO</h3>
          <div className="form-row">
            <div className="form-col">
              <label className="form-label muted">Cuit:</label>
              <p className="readonly-text">{tempSocioCuit} ✓</p>
            </div>
            <div className="form-col">
              <label className="form-label muted">Nombre:</label>
              <p className="readonly-text">{tempSocioNombre}</p>
            </div>
          </div>
          <div className="step-section input-width-sm">
            <label className="form-label readonly-text-highlight">
              Participación
            </label>
            <input
              type="number"
              value={tempSocioParticipacion}
              onChange={(e) => setTempSocioParticipacion(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-actions-flex">
            <button
              type="button"
              onClick={() =>
                socios.length === 0
                  ? setFaseSocio("ingresar_cuit")
                  : setFaseSocio("lista")
              }
              className="btn-cancel"
            >
              CANCELAR
            </button>
            <button type="button" onClick={guardarSocio} className="btn-action">
              GUARDAR
            </button>
          </div>
        </div>
      )}

      {faseSocio === "lista" && (
        <div className="step-section">
          <h3 className="step-subtitle highlight">SOCIOS</h3>
          <div className="socio-list-container">
            {socios.map((socio, index) => (
              <div className="socio-item" key={index}>
                <div className="socio-info-main">
                  <span className="status-icon status-check readonly-text-highlight">
                    ✓
                  </span>
                  <div>
                    <h4 className="socio-name">{socio.nombre}</h4>
                    <p className="socio-cuit">CUIT {socio.cuit}</p>
                  </div>
                </div>
                <div className="socio-participacion">
                  Socio &nbsp;&nbsp;&nbsp;&nbsp; {socio.participacion}% participación
                </div>
                <div className="socio-actions">
                  <button type="button" className="action-icon">
                    <FiEdit />
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarSocio(index)}
                    className="action-icon"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="step-section bolsa-container">
            <button
              type="button"
              onClick={iniciarCargaSocio}
              className="btn-outline btn-sm"
            >
              AGREGAR SOCIO
            </button>
          </div>
          <div className="form-actions-right section-divider">
            <button
              type="button"
              onClick={continuarAlProximoPaso}
              className="btn-action"
            >
              CONTINUAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}