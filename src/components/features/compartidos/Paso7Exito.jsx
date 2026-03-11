import React from "react";

export default function Paso7Exito({ onVolverInicio }) {
  return (
    <div className="paso-7-animado">
      <div className="success-container">
        <p className="success-text">
          Se ha enviado a tu cliente un mail de bienvenida, contactate con él
          para que se registre en la plataforma, acepte los Términos y
          condiciones y valide sus datos. (Si no recibe el mail, por favor que
          revise su casilla de spam.)
          <br />
          <br />
          Luego de validada la documentación ingresada, el cliente va a recibir
          por mail la Oferta de Contrato y fianza para firmarla en forma
          electrónica. Una vez registradas todas las firmas, vamos a
          habilitarles la línea y podrá comenzar a operar.
        </p>
      </div>

      <div className="form-actions-center">
        <button type="button" onClick={onVolverInicio} className="btn-action">
          VOLVER A LA LISTA
        </button>
      </div>
    </div>
  );
}