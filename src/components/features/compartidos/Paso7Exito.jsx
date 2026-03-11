import React from "react";
import { FiCheckCircle, FiDownload, FiMail, FiEdit3, FiArrowLeft, FiFileText } from "react-icons/fi";

export default function Paso7Exito({ onVolverInicio }) {
  return (
    <div className="paso-7-animado anim-fade-in">
      
      <div className="success-hero-modern">
        <div className="success-hero-glow"></div>
        <div className="success-hero-content">
          <FiCheckCircle className="success-hero-icon" />
          <div className="success-hero-text">
            <span className="success-hero-subtitle">Solicitud N°384 por $3.000.000</span>
            <h1 className="success-hero-title">¡Felicitaciones!<br/>Tu solicitud está pre-aprobada</h1>
          </div>
        </div>
      </div>

      <h3 className="step-subtitle white" style={{ marginTop: "3rem", marginBottom: "1.5rem" }}>
        Te contamos los pasos a seguir:
      </h3>

      <div className="next-steps-container">
        
        <div className="step-card-modern">
          <div className="step-card-number">1</div>
          <div className="step-card-content">
            <h4 className="step-card-title">Descargá y enviá la instrucción</h4>
            <p className="step-card-text">
              Descargá este documento, firmalo y envialo escaneado vía mail a <a href="mailto:comerciales@bindgarantias.com.ar" className="text-highlight">comerciales@bindgarantias.com.ar</a>. <br/>
              <span style={{ color: '#aaa', fontSize: '0.9rem' }}>¡Es firma simple, no hace falta certificar!</span>
            </p>
            
            <div className="download-box-modern">
              <div className="download-info">
                <FiFileText className="download-icon" />
                <span>Nota de instrucción permanente.pdf</span>
              </div>
              <button type="button" className="btn-download">
                <FiDownload /> DESCARGAR
              </button>
            </div>
          </div>
        </div>

        <div className="step-card-modern">
          <div className="step-card-number">2</div>
          <div className="step-card-content">
            <h4 className="step-card-title">Firmá electrónicamente el Contrato y Fianza</h4>
            <p className="step-card-text">
              Una vez validada la documentación ingresada, recibirán por mail la solicitud de firma de la <strong>Oferta del Contrato de Garantía Recíproca</strong> para realizarla en forma electrónica. 
            </p>
            <div className="info-pill-modern">
              <FiEdit3 className="pill-icon" />
              <span>La firma se valida a través de AFIP. Necesitarán clave fiscal Nivel 2 o superior.</span>
            </div>
            <p className="step-card-text" style={{ marginTop: '10px' }}>
              Una vez registradas todas las firmas, vamos a habilitarles la línea en nuestros sistemas para que puedan comenzar a operar.
            </p>
          </div>
        </div>

      </div>

      <hr className="section-divider" style={{ margin: "3rem 0 2rem 0" }} />

      <div className="form-actions-left">
        <button 
          type="button" 
          onClick={onVolverInicio} 
          className="btn-outline action-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <FiArrowLeft /> VOLVER A LA LISTA DE SOLICITUDES
        </button>
      </div>

    </div>
  );
}