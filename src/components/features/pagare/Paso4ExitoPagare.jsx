import React from "react";
import { FiCheckCircle, FiArrowLeft, FiClock, FiPhoneCall } from "react-icons/fi";

export default function Paso4ExitoPagare({ onVolverLista }) {
  return (
    <div className="pagare-success-animado anim-fade-in">
      
      {/* 1. HERO BANNER DE ÉXITO */}
      <div className="success-hero-modern">
        <div className="success-hero-glow"></div>
        <div className="success-hero-content">
          <FiCheckCircle className="success-hero-icon" />
          <div className="success-hero-text">
            <span className="success-hero-subtitle">Solicitud N° 4362</span>
            <h1 className="success-hero-title">¡Felicitaciones!<br/>Tu solicitud está aprobada</h1>
          </div>
        </div>
      </div>

      {/* 2. TARJETAS DE INFORMACIÓN */}
      <div className="next-steps-container">
        
        {/* Tarjeta 1: Proceso */}
        <div className="step-card-modern">
          {/* Le damos un toque amarillo al ícono para diferenciarlo de los pasos numerados */}
          <div className="step-card-number" style={{ backgroundColor: 'rgba(244, 245, 0, 0.05)', color: 'var(--yellow)', borderColor: 'rgba(244, 245, 0, 0.2)' }}>
            <FiClock />
          </div>
          <div className="step-card-content">
            <p className="step-card-text">
              Has finalizado todo el proceso necesario por tu parte. Nosotros estaremos avalando y vendiendo el pagaré. <strong>Apenas tengamos novedades nos estaremos poniendo en contacto con vos.</strong>
            </p>
          </div>
        </div>

      </div>

      <hr className="section-divider" style={{ margin: "3rem 0 2rem 0" }} />

      {/* 3. BOTÓN VOLVER */}
      <div className="form-actions-left">
        <button 
          type="button" 
          onClick={onVolverLista} 
          className="btn-outline action-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <FiArrowLeft /> VOLVER A LA LISTA DE SOLICITUDES
        </button>
      </div>

    </div>
  );
}