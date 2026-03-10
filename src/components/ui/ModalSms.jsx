import React from "react";

export default function ModalSms({ 
  isOpen, 
  onClose, 
  codigoSms, 
  setCodigoSms, 
  onConfirmar 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h3 className="modal-title">Ingresá el código de verificación</h3>
          <button onClick={onClose} className="modal-close">✖</button>
        </div>
        <div className="modal-body">
          <p className="modal-text">
            Te enviamos un sms con un código de verificación para que valides tu celular.
          </p>
          <label className="modal-label">Código verificación *</label>
          <input 
            type="text" 
            value={codigoSms} 
            onChange={(e) => setCodigoSms(e.target.value)} 
            className="modal-input" 
          />
          <div className="modal-footer">
            <button onClick={onClose} className="btn-cancel">CANCELAR</button>
            <button onClick={onConfirmar} className="btn-action btn-rounded">
              ACEPTAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}