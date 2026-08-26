import React from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import styles from "./AvisoBloqueoLegajoModal.module.css";

// Aviso "fuerte" (igual criterio que MigracionExitosaModal, pero en rojo)
// para el caso opuesto: el socio no pasó el CDA de PANTALLA_INGRESO_CUIT y
// no va a poder cargar ni modificar nada del legajo/documentación hasta que
// se resuelva. Se dispara una sola vez al entrar a la pantalla de Legajo
// (ver SociosView.jsx) - la razón sigue visible después en el banner de
// LegajoUniversalBar, esto es solo para que no pase desapercibido.
export function AvisoBloqueoLegajoModal({ isOpen, onClose, motivos = [] }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="440px">
      <div className={styles.content}>
        <div className={styles.iconWrap}>
          <span className={styles.badge}>
            <FiAlertTriangle size={30} strokeWidth={2.2} />
          </span>
        </div>

        <h2 className={styles.title}>No podés avanzar por ahora</h2>
        <p className={styles.mensaje}>
          Podés moverte entre Legajo y Documentación para revisar tus datos,
          pero no vas a poder cargar ni modificar nada hasta que se resuelva
          lo siguiente:
        </p>
        <ul className={styles.listaMotivos}>
          {motivos.map((motivo) => (
            <li key={motivo}>{motivo}</li>
          ))}
        </ul>

        <Button variant="danger" onClick={onClose} className={styles.btnAceptar}>
          Entendido
        </Button>
      </div>
    </Modal>
  );
}

export default AvisoBloqueoLegajoModal;
