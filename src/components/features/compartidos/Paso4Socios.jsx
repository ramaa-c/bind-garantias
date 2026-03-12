import React from "react";
import { FiEdit, FiTrash2, FiSearch, FiUserPlus, FiCheckCircle, FiPercent } from "react-icons/fi";
import { FaUser } from "react-icons/fa";

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
      
      {/* FASE 1: BUSCAR CUIT */}
      {faseSocio === "ingresar_cuit" && (
        <div className="step-section anim-fade-in">
          <h3 className="step-subtitle white" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiUserPlus /> Añadir nuevo socio
          </h3>
          <p className="form-label muted" style={{ marginBottom: "20px" }}>
            Ingresá el número de CUIT/CUIL para validar su identidad en AFIP.
          </p>
          
          <div className="search-cuit-container">
            <div className="input-with-icon flex-1">
              <input
                type="text"
                placeholder="Ej: 20304050608"
                value={tempSocioCuit}
                onChange={(e) => setTempSocioCuit(e.target.value)}
                className="form-input"
                style={{ marginBottom: 0 }}
              />
            </div>
            <button type="button" onClick={validarCuitSocio} className="btn-action">
              VALIDAR CUIT
            </button>
          </div>

          {socios.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <button type="button" className="btn-link action-secondary" onClick={() => setFaseSocio("lista")}>
                Cancelar y volver a la lista
              </button>
            </div>
          )}
        </div>
      )}

      {/* FASE 2: COMPLETAR PORCENTAJE */}
      {faseSocio === "completar_datos" && (
        <div className="step-section anim-fade-in">
          <h3 className="step-subtitle white">Completar datos del socio</h3>
          
          <div className="verified-summary-card">
            <div className="summary-info-group">
              <div className="summary-status">
                <FiCheckCircle className="status-icon-check" />
                <span className="summary-label-modern">IDENTIDAD VALIDADA</span>
              </div>
              <p className="summary-value-highlight">{tempSocioNombre}</p>
              <p className="summary-value-business">CUIT: {tempSocioCuit}</p>
            </div>
          </div>

          <div className="form-group-spaced input-width-sm" style={{ marginTop: '2rem' }}>
            <label className="form-label">Porcentaje de participación *</label>
            <div className="input-with-icon">
              <FiPercent className="input-icon" />
              <input
                type="number"
                placeholder="Ej: 50"
                value={tempSocioParticipacion}
                onChange={(e) => setTempSocioParticipacion(e.target.value)}
                className="form-input form-input-pl"
              />
            </div>
          </div>

          <div className="form-actions-flex" style={{ marginTop: "2rem" }}>
            <button
              type="button"
              onClick={() => socios.length === 0 ? setFaseSocio("ingresar_cuit") : setFaseSocio("lista")}
              className="btn-outline action-secondary"
              style={{ border: 'none' }}
            >
              CANCELAR
            </button>
            <button type="button" onClick={guardarSocio} className="btn-action">
              GUARDAR SOCIO
            </button>
          </div>
        </div>
      )}

      {/* FASE 3: LISTA DE SOCIOS Y CONTINUAR */}
      {faseSocio === "lista" && (
        <div className="step-section anim-fade-in">
          
          <div className="flex-between" style={{ marginBottom: "1.5rem" }}>
            <h3 className="step-subtitle white" style={{ margin: 0 }}>Socios declarados</h3>
            <span className="badge-count">{socios.length} socio{socios.length > 1 ? 's' : ''}</span>
          </div>

          <div className="agent-list-container" style={{ maxHeight: 'none', marginBottom: '2rem' }}>
            {socios.map((socio, index) => (
              <div className="agent-list-item cursor-default" key={index}>
                <div className="agent-item-left">
                  <div className="avatar-circle">
                    <FaUser size={16} />
                  </div>
                  <div className="summary-info-group">
                    <span className="agent-name">{socio.nombre}</span>
                    <span className="form-label muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                      CUIT {socio.cuit} • Participación: <strong style={{color: 'var(--yellow)'}}>{socio.participacion}%</strong>
                    </span>
                  </div>
                </div>
                
                <div className="agent-item-right" style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn-icon-ghost" title="Editar participación">
                    <FiEdit size={18} />
                  </button>
                  <button type="button" onClick={() => eliminarSocio(index)} className="btn-icon-ghost danger" title="Eliminar socio">
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="form-actions-flex" style={{ borderTop: "1px dashed #444", paddingTop: "2rem" }}>
            <button type="button" onClick={iniciarCargaSocio} className="btn-outline">
              <FiUserPlus style={{ marginRight: '8px' }}/> AGREGAR SOCIO
            </button>
            <button type="button" onClick={continuarAlProximoPaso} className="btn-action">
              CONTINUAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}