import React from "react";

export default function Paso4ExitoPagare({ onVolverLista }) {
  return (
    <div className="pagare-success-animado">
      <h2 className="pagare-success-title">¡Solicitud Aprobada!</h2>
      <div className="pagare-success-bar">
        <span>Solicitud N° 4362</span>
      </div>

      <p className="pagare-success-text">
        Has finalizado todo el proceso necesario, nosotros estaremos avalando y vendiendo el pagaré. Apenas tengamos novedades nos estaremos poniendo en contacto.
      </p>
      <p className="pagare-success-subtext">
        Si aún no acordaste una tasa tope para la venta o ante cualquier consulta no dudes en comunicarte con nosotros.
      </p>

      <div className="pagare-success-actions">
        <button type="button" className="btn-outline" onClick={onVolverLista}>
          VOLVER A LA LISTA
        </button>
      </div>
    </div>
  );
}