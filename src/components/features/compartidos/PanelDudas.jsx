import React from "react";

export default function PanelDudas({ pasoActual }) {

  return (
    <div className="panel-dudas">
      <h3 className="panel-dudas-title">Dudas frecuentes</h3>
      <ul className="faq-list">
        {pasoActual === 4 || pasoActual === 5 ? (
          <>
            <li className="faq-item">¿Por qué debo declarar a mis socios?</li>
            <li className="faq-item">¿Qué pasa si un socio es extranjero?</li>
          </>
        ) : (
          <>
            <li className="faq-item">¿Qué es el CUIT?</li>
            <li className="faq-item">¿Cómo verifico mi CUIT?</li>
          </>
        )}
      </ul>
    </div>
  );
}