import React from "react";

export default function PanelDudasPagare({ pasoActual }) {
  if (pasoActual === 4) return null;

  return (
    <div className="panel-dudas">
      <h3 className="panel-dudas-title">Dudas frecuentes</h3>
      <ul className="faq-list">
        <li className="faq-item">¿Qué moneda seleccionar?</li>
        <li className="faq-item">¿Cuál es el monto máximo de la operación?</li>
        <li className="faq-item">¿Cómo genero mi ID en ePyme?</li>
        <li className="faq-item">¿La tasa que muestra el simulador es la tasa real?</li>
      </ul>
    </div>
  );
}